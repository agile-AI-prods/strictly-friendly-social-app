import React, { useEffect, useState } from 'react';
import { Modal, Button, Avatar, Tooltip } from 'antd'; // Or use your own modal library
import { FilePdfOutlined, EditOutlined, CopyOutlined, MailOutlined, MoreOutlined, StarFilled, DeleteOutlined } from '@ant-design/icons';
import { Activity, deleteActivity, setSelectedActivity, setShowCreateModal, setShowEventDetail } from '../../store/slices/activitySlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';

const EventDetailsModal = () => {

    const [eventData, setEventData] = useState<Activity>()
    const [isDeleting, setIsDeleting] = useState(false);
    const dispatch = useAppDispatch();
    const selectedActivity = useAppSelector(state => state.activities.selectedActivity)
    const showEventDetail = useAppSelector(state => state.activities.showEventDetail)
    const currentUser = useAppSelector(state => state.auth.user)
    useEffect(() => {
        if (selectedActivity)
            setEventData(selectedActivity)
    }, [selectedActivity])
    const onClose = () => {
        dispatch(setShowEventDetail(false));
        dispatch(setSelectedActivity(null));
    }

    if (!eventData?.id)
        return null
    return (

        <Modal
            open={showEventDetail}
            onCancel={onClose}
            footer={null}
            width={420}
            closeIcon={<span style={{ fontSize: 20 }}>×</span>}
            style={{ padding: 0, borderRadius: 12, overflow: 'hidden', fontSize: 20 }}
        >
            <div className="p-4">
                <div className="flex items-center mb-2">
                    <StarFilled className="text-yellow-400 mr-2" />
                    <span className="font-bold text-2xl">{eventData?.title}</span>
                </div>
                <div className="text-gray-800 mb-2 text-md">
                    {eventData && format(new Date(eventData?.start_datetime), 'yyyy-MM-dd HH:mm')} - {eventData && format(new Date(eventData?.end_datetime), 'yyyy-MM-dd HH:mm')}
                </div>
                <div className="text-gray-800 mb-2 text-md flex gap-2">
                    <MapPin />{eventData && eventData.location}
                </div>
                <div className="text-gray-800 mb-2 text-md flex gap-2">
                    <p>{eventData && eventData.description}</p>
                </div>
                {eventData?.participants && (
                    <div className="mb-2 text-lg">
                        <p className=''>Participants</p>
                        <div className="flex -space-x-2 mt-1 mb-2">
                            {eventData?.participants.map((person, idx) => (
                                <Tooltip key={person.id} title={person.user.name} >
                                    <Avatar
                                        key={person.id}
                                        src={person.user.photo_url}
                                        size={32}
                                        alt={person.user.photo_url}
                                        className="border-2 border-white"
                                    />
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                )}
                {eventData?.creator_id && (
                    <div className="text-md text-gray-800 mt-2">
                        Created by: <Tooltip title={eventData.creator?.name} ><Avatar
                            key={eventData.creator?.id}
                            src={eventData.creator?.photo_url}
                            size={32}
                            alt={eventData.creator?.photo_url}
                            className="border-2 border-white"
                        /></Tooltip>
                        <p>{eventData.creator?.email}</p>
                        {eventData.creator?.name}
                    </div>
                )}
                {currentUser?.id == eventData.creator_id && <div className="flex justify-end gap-2 mt-4">
                    <Button icon={<EditOutlined />} onClick={() => {
                        dispatch(setShowEventDetail(false))
                        dispatch(setShowCreateModal(true))
                    }} />
                    <Button
                        icon={<DeleteOutlined />}
                        loading={isDeleting}
                        onClick={async () => {
                            if (!selectedActivity) return;

                            setIsDeleting(true);
                            try {
                                await dispatch(deleteActivity(selectedActivity.id)).unwrap();
                                dispatch(setShowEventDetail(false));
                                dispatch(setSelectedActivity(null));
                            } catch (error) {
                                console.error('Error deleting activity:', error);
                            } finally {
                                setIsDeleting(false);
                                dispatch(setShowCreateModal(false))
                                dispatch(setShowEventDetail(false));
                                dispatch(setSelectedActivity(null))
                            }
                        }}
                    />
                </div>}
            </div>
        </Modal>
    );
};

export default EventDetailsModal;
