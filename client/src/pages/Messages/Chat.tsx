import { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { selectMessages, selectIsTyping, markAsRead, loadMessages, setEditingMessageId, MessageWithMeta, updateMessageReadStatus } from '../../store/slices/messageSlice';
import { useAppSelector } from '../../store/hooks';
import { selectUserStatus } from '../../store/slices/presenceSlice';
import { UserAvatarWithPresence } from '../../components/UserAvatarWithPresence';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Link } from 'react-router-dom';
import { WebRTCService } from '../../services/webrtc';
import CallInterface from './CallInterface';
import { message } from 'antd';
import { PhoneOutlined, VideoCameraOutlined } from '@ant-design/icons';
import socketService from '../../services/socketService';
import { uploadImage } from '../../api/messageApi';
import { useTheme } from '../../context/ThemeContext';

interface ChatProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}
function isOnlyEmoji(text: string | undefined | null) {
  // Check if text exists and is a string
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  return (
    text.replace(/\s/g, '').length > 0 &&
    /^([\p{Emoji_Presentation}]|[\p{Emoji}]\uFE0F|[\p{Emoji_Modifier_Base}][\p{Emoji_Modifier}]?)+$/u.test(
      text.replace(/\s/g, '')
    )
  );
}

export const Chat = ({ userId, userName, userAvatar }: ChatProps) => {

  const dispatch = useDispatch<AppDispatch>();
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const messages = useSelector(selectMessages);
  const typingUsers = useSelector(selectIsTyping);
  const [newMessage, setNewMessage] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [loading, setLoading] = useState(false);
  const conversation: MessageWithMeta[] = messages[userId] || [];
  const isTyping = typingUsers[userId] || false;
  const hasMoreMessages = useSelector((state: RootState) => state.messages.hasMoreMessages);
  const [page, setPage] = useState(1);
  const userStatus = useAppSelector(selectUserStatus(userId));
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const editingMessageId = useAppSelector(state => state.messages.editingMessageId);
  const [editingContent, setEditingContent] = useState('');
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const prevConversationLengthRef = useRef<number>(0);
  const isLoadingMoreRef = useRef<boolean>(false);
  const scrollPositionRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callIncoming, setCallIncoming] = useState(false);
  const [callFrom, setCallFrom] = useState<string | null>(null);
  const [callRinging, setCallRinging] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [callDuration, setCallDuration] = useState('00:00');
  const callStartTimeRef = useRef<number | null>(null);
  const callTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [mediaDeviceStatus, setMediaDeviceStatus] = useState<{
    hasAudio: boolean;
    hasVideo: boolean;
  } | null>(null);


  // --- WebRTC Service Setup ---
  const [webrtcService] = useState(() => {
    console.log('[WebRTC] Creating new WebRTCService instance');
    return new WebRTCService();
  });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pendingCandidatesRef = useRef<any[]>([]);

  // Define sendSignal
  const sendSignal = (data: any) => {
    console.log('[Signaling] Sending signal:', data);
    if (!user || !user.id) return;

    if (data.type === 'offer') {
      socketService.sendCallOffer(userId, data.offer, data.isVideoCall);
    } else if (data.type === 'answer') {
      socketService.sendCallAnswer(userId, data.answer);
    } else if (data.type === 'candidate') {
      socketService.sendIceCandidate(userId, data.candidate);
    } else if (data.type === 'end') {
      socketService.sendCallEnd(userId);
    }
  };
  useEffect(() => {
    const checkDevices = async () => {
      try {
        const deviceStatus = await WebRTCService.checkMediaDevices();
        setMediaDeviceStatus(deviceStatus);

        if (!deviceStatus.hasAudio) {
          message.info(
            "⚠️ No microphone detected. Voice calls may not work."
          );
        }
        if (!deviceStatus.hasVideo) {
          message.info(
            "⚠️ No camera detected. Video calls will use avatar."
          );
        }

      } catch (error) {
        console.error("❌ Error checking media devices:", error);
        message.info(
          "⚠️ Error checking media devices. Please refresh and allow permissions."
        );
      }
    };

    checkDevices();
  }, []);


  // Example: Start a call (caller)
  const startCall = async (video: boolean) => {
    try {

      console.log('[WebRTC] Starting call, video:', video);
      setIsVideoCall(video);
      setCallActive(true);
      setCallRinging(true);

      // Check media devices
      const { hasAudio, hasVideo } = await WebRTCService.checkMediaDevices();

      if (!hasAudio) {
        message.error(
          "❌ No microphone found. Please connect a microphone and try again."
        );
        return;
      }

      if (video && !hasVideo) {
        message.error("⚠️ No camera found - will use avatar for video call");
      }

      await webrtcService.initializePeerConnection();
      console.log('[WebRTC] Peer connection initialized');

      webrtcService.setOnRemoteStream((stream) => {
        console.log("🎵 Remote stream received during outgoing call:", {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length
        });
        setRemoteStream(stream);
      });

      webrtcService.setOnIceCandidate((candidate) => {
        console.log('[WebRTC] ICE candidate generated:', candidate);
        sendSignal({ type: 'candidate', candidate });
      });

      let stream: MediaStream;
      try {
        const needsVideo = video == true && hasVideo;
        console.log("🎥 Getting local stream for outgoing call, needsVideo:", needsVideo);
        stream = await webrtcService.getLocalStream(needsVideo);
        console.log("✅ Local stream obtained for outgoing call");
      } catch (error) {
        console.error("❌ Failed to get local stream:", error);
        message.error(
          `❌ ${error instanceof Error
            ? error.message
            : "Failed to access camera/microphone"
          }`
        );
        return;
      }

      setLocalStream(stream);

      // Add local stream to peer connection BEFORE creating offer
      webrtcService.addLocalStream(stream);
      // // Create offer and send via signaling
      const offer = await webrtcService.createOffer();
      console.log('[WebRTC] Created offer:', offer);
      sendSignal({ type: 'offer', offer, isVideoCall: video });
    }
    catch (error) {
      console.error("❌ Error starting call:", error);
      message.error(
        `❌ Failed to start call: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Example: Accept a call (callee)
  const acceptCall = async () => {
    try {
      console.log("✅ Accepting call from:", callFrom);

      const { hasAudio, hasVideo } = await WebRTCService.checkMediaDevices();

      if (!hasAudio) {
        message.error("❌ No microphone found. Cannot accept call.");
        declineCall();
        return;
      }

      if (isVideoCall && !hasVideo) {
        message.error("⚠️ No camera found - will use avatar for video call");
      }

      setCallActive(true);
      setCallIncoming(false);

      // Get local stream FIRST
      let stream: MediaStream;
      try {
        const needsVideo = isVideoCall && hasVideo;
        console.log("🎥 Getting local stream for incoming call, needsVideo:", needsVideo);
        stream = await webrtcService.getLocalStream(needsVideo);
        console.log("✅ Local stream obtained for incoming call");
      } catch (error) {
        console.error(
          "❌ Failed to get local stream for incoming call:",
          error
        );
        message.error(
          `❌ ${error instanceof Error
            ? error.message
            : "Failed to access camera/microphone"
          }`
        );
        declineCall();
        return;
      }

      setLocalStream(stream);
      webrtcService.addLocalStream(stream);


      const answer = await webrtcService.createAnswer();
      console.log('[WebRTC] Created answer:', answer);
      sendSignal({ type: 'answer', answer });
    }
    catch (error) {
      console.error("❌ Error accepting call:", error);
      message.error(
        `❌ Failed to accept call: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
      declineCall();
    }
  };

  useEffect(() => {
    const loadInitialMessages = async () => {
      if (!user?.id || !userId) return;
      setLoading(true);
      try {
        await dispatch(loadMessages({ userId: userId, page: 1 })).unwrap();
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialMessages();
  }, [user?.id, userId, dispatch]);

  // Handle scroll for loading more messages
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    scrollPositionRef.current = scrollTop;

    if (scrollTop === 0 && hasMoreMessages && !loading) {
      isLoadingMoreRef.current = true;
      setLoading(true);
      try {
        const nextPage = page + 1;
        await dispatch(loadMessages({ userId: userId!, page: nextPage })).unwrap();
        setPage(nextPage);
      } catch (error) {
        console.error('Error loading more messages:', error);
      } finally {
        setLoading(false);
        // Reset the flag after a short delay to allow for state updates
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, 100);
      }
    }
  };
  // Mark messages as read
  useEffect(() => {
    if (user && userId) {
      const unreadMessages = conversation
        .filter(msg => msg.sender_id === userId && !msg.read_at)
        .map(msg => msg.id);

      if (unreadMessages.length > 0) {
        dispatch(markAsRead(userId));
        // Notify the sender that their messages have been read
        socketService.sendMessageReadStatus(userId);
      }
    }
  }, [user, userId, conversation, dispatch]);

  // Scroll to bottom only when new messages are added (not when loading older messages)
  useEffect(() => {
    const currentLength = conversation.length;
    const prevLength = prevConversationLengthRef.current;

    // Don't auto-scroll if we're loading more messages
    if (isLoadingMoreRef.current) {
      prevConversationLengthRef.current = currentLength;
      return;
    }

    // Only scroll if new messages were added to the end and we're near the bottom
    const isNearBottom = scrollPositionRef.current < 100; // Within 100px of bottom
    if (currentLength > prevLength && isNearBottom && scrollContainerRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    // Update the previous length for next comparison
    prevConversationLengthRef.current = currentLength;
  }, [conversation]);

  // Handle typing status
  const handleTyping = async () => {
    if (!user) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing start via Socket.io and MongoDB API
    try {
      await socketService.startTyping(userId);
    } catch (error) {
      console.error('Error starting typing status:', error);
    }

    // Emit typing stop after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await socketService.stopTyping(userId);
      } catch (error) {
        console.error('Error stopping typing status:', error);
      }
    }, 1000);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !pendingImage) || !userId || !user) return;

    let imageUrl: string | undefined = undefined;

    if (pendingImage) {
      try {
        const { imageUrl: uploadedUrl } = await uploadImage(pendingImage);
        imageUrl = uploadedUrl;
      } catch (error) {
        alert('Failed to upload image');
        return;
      }
    }

    socketService.sendMessage({
      receiverId: userId,
      content: newMessage,
      imageUrl,
    });

    setNewMessage('');
    setPendingImage(null);
    setPendingImagePreview(null);

    // Clear typing status
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    try {
      await socketService.stopTyping(userId);
    } catch (error) {
      console.error('Error stopping typing status:', error);
    }
  };

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Handle edit message
  const handleEditMessage = (messageId: string, content: string) => {
    dispatch(setEditingMessageId(messageId));
    setEditingContent(content);
  };
  const handleEditSave = (messageId: string) => {
    // Use Socket.io for real-time editing
    socketService.editMessage(messageId, editingContent);
    dispatch(setEditingMessageId(null));
    setEditingContent('');
  };
  const handleEditCancel = () => {
    dispatch(setEditingMessageId(null));
    setEditingContent('');
  };
  // Handle delete message
  const handleDeleteMessage = (messageId: string) => {
    if (window.confirm('Delete this message?')) {
      // Use Socket.io for real-time deletion
      socketService.deleteMessage(messageId);
    }
  };

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpenFor) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpenFor(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenFor]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingImage(file);
      setPendingImagePreview(URL.createObjectURL(file));
      e.target.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setPendingImage(file);
          setPendingImagePreview(URL.createObjectURL(file));
          e.preventDefault();
          break;
        }
      }
    }
  };

  // --- Robust call channel subscription effect ---
  useEffect(() => {
    if (!user?.id || !userId) return;

    // Set up Socket.io call event listeners
    const handleCallOffer = (event: CustomEvent) => {
      const { from, offer, isVideoCall } = event.detail;
      if (from !== user?.id) {
        console.log("Call offer received:", event.detail);
        setIsVideoCall(isVideoCall ?? true);
        setCallIncoming(true);
        setCallFrom(from);
        handleIncomingCall(offer);
      }
    };

    const handleCallAnswer = (event: CustomEvent) => {
      const { from, answer } = event.detail;
      if (from !== user?.id) {
        console.log("Call answer received:", event.detail);
        setCallRinging(false);
        handleCallAnswerReceived(answer);
      }
    };

    const handleCallIceCandidate = (event: CustomEvent) => {
      const { from, candidate } = event.detail;
      if (from !== user?.id) {
        console.log("Call ICE candidate received:", event.detail);
        addIceCandidateOrQueue(candidate);
      }
    };

    const handleCallEnd = (event: CustomEvent) => {
      const { from } = event.detail;
      if (from !== user?.id) {
        console.log("Call end received:", event.detail);
        cleanupCall();
      }
    };

    const handleCallDecline = (event: CustomEvent) => {
      const { from } = event.detail;
      if (from !== user?.id) {
        console.log("Call decline received:", event.detail);
        cleanupCall();
      }
    };

    // Add event listeners
    window.addEventListener('call:offer', handleCallOffer as EventListener);
    window.addEventListener('call:answer', handleCallAnswer as EventListener);
    window.addEventListener('call:ice-candidate', handleCallIceCandidate as EventListener);
    window.addEventListener('call:end', handleCallEnd as EventListener);
    window.addEventListener('call:decline', handleCallDecline as EventListener);

    // Add message read status listener
    const handleMessageMarkedAsRead = (event: CustomEvent) => {
      const { from } = event.detail;
      if (from === userId) {
        console.log('Messages marked as read by:', from);
        // Update message status for messages sent to this user
        const messageIds = conversation
          .filter(msg => msg.sender_id === user?.id && msg.receiver_id === from && !msg.read_at)
          .map(msg => msg.id);

        if (messageIds.length > 0) {
          dispatch(updateMessageReadStatus({
            userId: from,
            messageIds,
            status: 'read'
          }));
        }
      }
    };
    window.addEventListener('message:marked-as-read', handleMessageMarkedAsRead as EventListener);

    return () => {
      // Remove event listeners
      window.removeEventListener('call:offer', handleCallOffer as EventListener);
      window.removeEventListener('call:answer', handleCallAnswer as EventListener);
      window.removeEventListener('call:ice-candidate', handleCallIceCandidate as EventListener);
      window.removeEventListener('call:end', handleCallEnd as EventListener);
      window.removeEventListener('call:decline', handleCallDecline as EventListener);
      window.removeEventListener('message:marked-as-read', handleMessageMarkedAsRead as EventListener);
    };
  }, [user?.id, userId, dispatch, conversation]);

  // Timer effect using state
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (callActive && callStartTimeRef.current !== null) {
      interval = setInterval(() => {
        if (callStartTimeRef.current !== null) {
          const elapsed = Math.floor((Date.now() - callStartTimeRef.current!) / 1000);
          const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
          const sec = String(elapsed % 60).padStart(2, '0');
          setCallDuration(`${min}:${sec}`);
        }
      }, 3000);
    } else {
      setCallDuration('00:00');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callActive]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };
  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsCameraOn(track.enabled);
      });
    }
  };

  // Implement declineCall if missing
  const declineCall = () => {
    socketService.sendCallDecline(userId);
    cleanupCall();
  };

  // In cleanupCall, use webrtcService.hangup()
  const cleanupCall = () => {
    setCallActive(false);
    setCallIncoming(false);
    setCallRinging(false);
    setIsVideoCall(false);
    setCallFrom(null);
    setCallDuration('00:00');
    callStartTimeRef.current = null;
    if (callTimerIntervalRef.current) {
      clearInterval(callTimerIntervalRef.current);
      callTimerIntervalRef.current = null;
    }
    webrtcService.hangup();
    setLocalStream(null);
    setRemoteStream(null);
    // setRemoteStream(null)
    // if (localVideoRef.current) localVideoRef.current.srcObject = null;
    // if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  // In endCall, use sendSignal and cleanupCall
  const endCall = () => {
    socketService.sendCallEnd(userId);
    cleanupCall();
  };

  const startCallTimer = () => {
    if (callTimerIntervalRef.current) clearInterval(callTimerIntervalRef.current);
    callTimerIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current!) / 1000);
        const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const sec = String(elapsed % 60).padStart(2, '0');
        setCallDuration(`${min}:${sec}`);
      }
    }, 1000);
  };

  // Helper to add ICE candidate or queue if remoteDescription is not set
  const addIceCandidateOrQueue = async (candidate: RTCIceCandidateInit) => {
    try {
      console.log('[WebRTC] Trying to add ICE candidate:', candidate);
      await webrtcService.addIceCandidate(candidate);
      console.log('[WebRTC] ICE candidate added:', candidate);
    } catch (err) {
      // If remoteDescription is not set, queue
      pendingCandidatesRef.current.push(candidate);
      console.log('[WebRTC] Queued ICE candidate:', candidate);
    }
  };

  // Helper function to handle incoming call
  const handleIncomingCall = async (offer: RTCSessionDescriptionInit) => {
    try {
      await webrtcService.initializePeerConnection();
      webrtcService.setOnRemoteStream((stream) => {
        console.log("🎵 Remote stream received in incoming call");
        setRemoteStream(stream);
      });

      webrtcService.setOnIceCandidate((candidate) => {
        console.log('[WebRTC] ICE candidate generated:', candidate);
        sendSignal({ type: 'candidate', candidate });
      });
      await webrtcService.setRemoteDescription(offer);
      // Flush any queued ICE candidates now that remote description is set
      if (pendingCandidatesRef.current.length) {
        const queued = pendingCandidatesRef.current.splice(0);
        for (const cand of queued) {
          try { await webrtcService.addIceCandidate(cand); } catch { }
        }
      }
    } catch (error) {
      console.error("❌ Error handling incoming call:", error);
      message.error("❌ Error handling incoming call");
    }
  };

  // Helper function to handle call answer received
  const handleCallAnswerReceived = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (answer) {
        await webrtcService.setRemoteDescription(answer);
      }
      // Flush any queued ICE candidates now that remote description is set
      if (pendingCandidatesRef.current.length) {
        const queued = pendingCandidatesRef.current.splice(0);
        for (const cand of queued) {
          try { await webrtcService.addIceCandidate(cand); } catch { }
        }
      }
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
        startCallTimer();
      }
    } catch (error) {
      console.error("❌ Error handling call answer:", error);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className={`flex items-center p-3 h-20 border-b ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <Link to={`/profile/${userId}`}>
            <UserAvatarWithPresence userId={userId} photoUrl={userAvatar} size={40} alt={userName} />
          </Link>
          <div className="ml-3">
            <h3 className={`text-sm font-medium flex items-center gap-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
              {userName}
              <span className={`text-xs font-semibold ${userStatus === 'online' ? 'text-green-600' :
                userStatus === 'idle' ? 'text-yellow-600' : effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                }`}>

              </span>
            </h3>
            <p className={`text-xs ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
              }`}>
              {isTyping ? 'Typing...' : userStatus === 'online' ? 'Online' : userStatus === 'idle' ? 'Idle' : 'Offline'}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => startCall(false)}
              className={`p-2 rounded-lg bg-${currentColor.primary} hover:bg-${currentColor.hover} transition-colors text-white`}
              title="Voice Call"
            >
              <PhoneOutlined className="h-5 w-5" />
            </button>
            <button
              onClick={() => startCall(true)}
              className={`p-2 rounded-lg bg-${currentColor.primary} hover:bg-${currentColor.hover} transition-colors text-white`}
              title="Video Call"
            >
              <VideoCameraOutlined className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4"
          onScroll={handleScroll}
          ref={scrollContainerRef}
        >
          {loading && (
            <div className="flex justify-center p-4">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${currentColor.primary}`}></div>
            </div>
          )}
          {conversation.map((message: MessageWithMeta) => {
            const isSelf = message.sender_id === user?.id;
            
            // Debug logging for message content
            console.log('Message object:', message);
            console.log('Message content:', message.content);
            console.log('Message content type:', typeof message.content);
            
            const onlyEmoji = isOnlyEmoji(message.content);
            const isEditing = editingMessageId === message.id;
            const messageDate = new Date(message.created_at);
            const messageDay = messageDate.toDateString();

            // Check if we need to show a date divider
            const prevMessage = conversation[conversation.indexOf(message) - 1];
            const showDateDivider = !prevMessage || new Date(prevMessage.created_at).toDateString() !== messageDay;

            const formatDate = (date: Date) => {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);

              if (date.toDateString() === today.toDateString()) {
                return 'Today';
              } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
              } else {
                return date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              }
            };

            return (
              <div key={message.id}>
                {showDateDivider && (
                  <div className="flex justify-center my-4">
                    <div className={`text-xs px-3 py-1 rounded-full ${effectiveTheme === 'dark'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-600'
                      }`}>
                      {formatDate(messageDate)}
                    </div>
                  </div>
                )}
                <div className={`group flex items-start mb-4 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                  {/* Avatar on left for others, right for self */}
                  {!isSelf && (
                    <Link to={`/profile/${userId}`}>
                      <UserAvatarWithPresence userId={userId} photoUrl={userAvatar} size={40} alt={userName} />
                    </Link>
                  )}
                  <div className="mx-3 relative flex flex-col items-start max-w-xs">
                    {/* Arrow (tail) */}
                    <span
                      className={`absolute top-2 ${isSelf ? 'right-[-8px]' : 'left-[-8px]'} w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent ${isSelf
                        ? effectiveTheme === 'dark' ? 'border-l-8 border-l-gray-700' : 'border-l-8 border-l-green-50'
                        : effectiveTheme === 'dark' ? 'border-r-8 border-r-gray-600' : 'border-r-8 border-r-blue-50'
                        }`}
                    />
                    <div className={`rounded-2xl px-4 py-2 relative ${isSelf
                      ? effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-green-50'
                      : effectiveTheme === 'dark' ? 'bg-gray-600' : 'bg-blue-50'
                      }`}>
                      {/* Message text or edit field */}
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <textarea
                            className="w-full border rounded p-1 text-sm"
                            value={editingContent}
                            onChange={e => setEditingContent(e.target.value)}
                            rows={1}
                          />
                          <div className="flex gap-2">
                            <button className="text-xs text-blue-600" onClick={() => handleEditSave(message.id)}>Save</button>
                            <button className="text-xs text-gray-400" onClick={handleEditCancel}>Cancel</button>
                          </div>
                        </div>
                      ) : message.deleted ? (
                        <span className={`italic ${effectiveTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`}>Message deleted</span>
                      ) : (
                        <div>
                          {message.content && (
                            <p
                              className={`mb-1 ${onlyEmoji ? 'text-4xl leading-tight text-center' : 'text-sm'} ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                                }`}
                              style={onlyEmoji ? { fontSize: '3rem', lineHeight: 1.1 } : {}}
                            >
                              {message.content}
                            </p>
                          )}
                          {message.imageUrl && (
                            <img
                              src={message.imageUrl}
                              alt="Sent"
                              className={`max-w-xs max-h-60 rounded-lg mb-2 ${effectiveTheme === 'dark' ? 'filter brightness-90' : ''}`}
                            />
                          )}
                          <div className='flex justify-between gap-1'>

                            <p className={`text-[10px] text-left ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                              }`}>
                              {message.created_at && new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>{/* Status checkmarks for self */}
                            {isSelf && (
                              <p className="text-right text-xs">
                                {message.status === 'read' ? (
                                  <span className={`text-${currentColor.primary}`}>✓✓</span>
                                ) : message.status === 'sent' ? (
                                  <span className={`${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>✓✓</span>
                                ) : (
                                  <span className={`${effectiveTheme === 'dark' ? 'text-gray-500' : 'text-gray-300'}`}>✓</span>
                                )}
                              </p>
                            )}</div>

                        </div>
                      )}

                    </div>
                    {/* Telegram-style dropdown menu */}
                    {isSelf && (
                      <button
                        className={`absolute top-1 left-[-28px] opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          }`}
                        onClick={() => setMenuOpenFor(message.id)}
                        title="More"
                      >
                        <span className={`w-5 h-5 text-xl ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                          }`}>&#8230;</span>
                      </button>
                    )}
                    {menuOpenFor === message.id && (
                      <div ref={menuRef} className={`absolute top-7 right-8 border rounded shadow-lg z-50 min-w-[120px] ${effectiveTheme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                        {isSelf && <>
                          <button
                            className={`block w-full text-left px-4 py-2 text-sm ${effectiveTheme === 'dark'
                              ? 'text-gray-200 hover:bg-gray-600'
                              : 'text-gray-900 hover:bg-gray-100'
                              }`}
                            onClick={() => { handleEditMessage(message.id, message.content); setMenuOpenFor(null); }}
                          >Edit</button>
                          <button
                            className={`block w-full text-left px-4 py-2 text-sm ${effectiveTheme === 'dark'
                              ? 'text-red-400 hover:bg-gray-600'
                              : 'text-red-600 hover:bg-gray-100'
                              }`}
                            onClick={() => { handleDeleteMessage(message.id); setMenuOpenFor(null); }}
                          >Delete</button>
                        </>}
                      </div>
                    )}
                  </div>
                  {/* Avatar on right for self */}
                  {isSelf && (
                    <Link to={`/profile/${user?.id}`}>
                      <UserAvatarWithPresence userId={user?.id || ''} photoUrl={user?.photo_url} size={40} alt="You" />
                    </Link>
                  )}

                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} data-testid="messages-end" />
        </div>

        {/* Message input box */}
        <div className={`border-t p-4 ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-items-center space-x-2 ">
            <div className="flex-1 relative">
              {pendingImagePreview && (
                <div className="mb-2 relative">
                  <img
                    src={pendingImagePreview}
                    alt="Preview"
                    className={`max-h-32 rounded ${effectiveTheme === 'dark' ? 'filter brightness-90' : ''}`}
                  />
                  <button
                    type="button"
                    className={`absolute top-1 right-1 rounded-full p-1 ${effectiveTheme === 'dark' ? 'bg-gray-800 bg-opacity-80' : 'bg-white bg-opacity-80'}`}
                    onClick={() => { setPendingImage(null); setPendingImagePreview(null); }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              )}

              <textarea
                value={newMessage}
                onChange={handleMessageChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} resize-none ${effectiveTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                rows={1}
                ref={textareaRef}
                onPaste={handlePaste}
              />

              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <button
                type="button"
                className={`absolute right-10 bottom-4 ${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                onClick={() => fileInputRef.current?.click()}
                title="Attach image"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`absolute right-2 bottom-4 ${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                type="button"
                title="Emoji"
              >
                <Smile className="h-5 w-5" />
              </button>

              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-12 right-0 z-50">
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji: any) => setNewMessage(newMessage + emoji.native)}
                    theme="light"
                    previewPosition="none"
                    skinTonePosition="search"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && !pendingImage}
              className={`text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-${currentColor.primary} hover:bg-${currentColor.hover}`}
              title="Send"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div> {/* End of main chat container */}

      {/* Call modals rendered outside main chat container */}
      {callIncoming && (
        <div className={`fixed inset-0 ${effectiveTheme === 'dark' ? 'bg-black bg-opacity-80' : 'bg-black bg-opacity-60'} flex flex-col items-center justify-center z-50`}>
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded shadow-lg flex flex-col items-center border ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'} ${getFontSizeClassForElement('text-base')} mb-4`}>
              Incoming {isVideoCall ? 'Video' : 'Voice'} Call...
            </p>
            <div className="flex gap-4 mt-4">
              <button
                onClick={acceptCall}
                className={`bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white px-4 py-2 rounded transition-colors ${getFontSizeClassForElement('text-sm')}`}
              >
                Accept
              </button>
              <button
                onClick={declineCall}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {callRinging && (
        <div className={`fixed inset-0 ${effectiveTheme === 'dark' ? 'bg-black bg-opacity-80' : 'bg-black bg-opacity-60'} flex items-center justify-center z-50`}>
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 flex flex-col items-center border ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="text-3xl mb-4 animate-bounce">🔔</div>
            <h2 className={`${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'} text-xl font-semibold mb-2 ${getFontSizeClassForElement('text-xl')}`}>
              Ringing...
            </h2>
            <p className={`mb-4 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} ${getFontSizeClassForElement('text-base')}`}>
              Waiting for the other user to answer
            </p>
            <button
              onClick={declineCall}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded transition-colors"
            >
              Cancel Call
            </button>
          </div>
        </div>
      )}

      {!callRinging && callActive && (
        <CallInterface
          localStream={localStream}
          remoteStream={remoteStream}
          callType={isVideoCall ? 'video' : 'audio'}
          otherUser={{ username: userName, userAvatar }}
          onEndCall={endCall}
          hasVideo={mediaDeviceStatus?.hasVideo || false}
        />
      )}
    </>
  );
};