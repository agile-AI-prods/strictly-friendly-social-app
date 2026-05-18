import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchComments as fetchCommentsApi, createComment as createCommentApi, updateComment as updateCommentApi, deleteComment as deleteCommentApi } from '../../api/commentApi';
import { Profile } from '../../types';

export interface Comment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: Profile;
}

interface CommentsState {
  comments: { [activityId: string]: Comment[] };
  loading: boolean;
  error: string | null;
  status: {
    fetchComments: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    createComment: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    updateComment: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    deleteComment: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  };
}

const initialState: CommentsState = {
  comments: {},
  loading: false,
  error: null,
  status: {
    fetchComments: 'idle',
    createComment: 'idle',
    updateComment: 'idle',
    deleteComment: 'idle',
  },
};

// Async thunks
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (activityId: string) => {
    const data = await fetchCommentsApi(activityId);
    return { activityId, comments: data };
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ activityId, content }: { activityId: string; content: string }) => {
    const data = await createCommentApi(activityId, content);
    return data;
  }
);

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ commentId, content }: { commentId: string; content: string }) => {
    const data = await updateCommentApi(commentId, content);
    return data;
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (commentId: string) => {
    const data = await deleteCommentApi(commentId);
    return commentId;
  }
);

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearComments: (state) => {
      state.comments = {};
    },
    addComment: (state, action) => {
      const { activityId, comment } = action.payload;
      if (!state.comments[activityId]) {
        state.comments[activityId] = [];
      }
      state.comments[activityId].push(comment);
    },
    updateCommentRealtime: (state, action) => {
      const { activityId, comment } = action.payload;
      const comments = state.comments[activityId];
      if (comments) {
        const index = comments.findIndex(c => c.id === comment.id);
        if (index !== -1) {
          comments[index] = comment;
        }
      }
    },
    removeComment: (state, action) => {
      const { activityId, commentId } = action.payload;
      const comments = state.comments[activityId];
      if (comments) {
        state.comments[activityId] = comments.filter(c => c.id !== commentId);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch comments
    builder
      .addCase(fetchComments.pending, (state) => {
        state.status.fetchComments = 'pending';
        state.loading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.status.fetchComments = 'fulfilled';
        state.loading = false;
        state.comments[action.payload.activityId] = action.payload.comments;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.status.fetchComments = 'rejected';
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch comments';
      });

    // Create comment
    builder
      .addCase(createComment.pending, (state) => {
        state.status.createComment = 'pending';
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.status.createComment = 'fulfilled';
        const comment = action.payload;
        if (!state.comments[comment.activity_id]) {
          state.comments[comment.activity_id] = [];
        }
        state.comments[comment.activity_id].push(comment);
      })
      .addCase(createComment.rejected, (state, action) => {
        state.status.createComment = 'rejected';
        state.error = action.error.message || 'Failed to create comment';
      });

    // Update comment
    builder
      .addCase(updateComment.pending, (state) => {
        state.status.updateComment = 'pending';
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.status.updateComment = 'fulfilled';
        const updatedComment = action.payload;
        const comments = state.comments[updatedComment.activity_id];
        if (comments) {
          const index = comments.findIndex(c => c.id === updatedComment.id);
          if (index !== -1) {
            comments[index] = updatedComment;
          }
        }
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.status.updateComment = 'rejected';
        state.error = action.error.message || 'Failed to update comment';
      });

    // Delete comment
    builder
      .addCase(deleteComment.pending, (state) => {
        state.status.deleteComment = 'pending';
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.status.deleteComment = 'fulfilled';
        // Find and remove the comment from the appropriate activity
        Object.keys(state.comments).forEach(activityId => {
          state.comments[activityId] = state.comments[activityId].filter(
            c => c.id !== action.payload
          );
        });
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.status.deleteComment = 'rejected';
        state.error = action.error.message || 'Failed to delete comment';
      });
  },
});

export const { 
  clearComments, 
  addComment,
  updateCommentRealtime,
  removeComment
} = commentsSlice.actions;

export default commentsSlice.reducer; 