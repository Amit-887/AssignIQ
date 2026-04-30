import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import sectionService from '../sectionService';

// Async thunks
export const createSection = createAsyncThunk(
  'sections/create',
  async (sectionData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await sectionService.createSection(sectionData, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create section';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getTeacherSections = createAsyncThunk(
  'sections/getTeacherSections',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await sectionService.getTeacherSections(token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get sections';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getAvailableSections = createAsyncThunk(
  'sections/getAvailable',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await sectionService.getAvailableSections(token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get available sections';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const joinSection = createAsyncThunk(
  'sections/join',
  async (joinCode, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await sectionService.joinSection(joinCode, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to join section';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getStudentSections = createAsyncThunk(
  'sections/getStudentSections',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await sectionService.getStudentSections(token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get student sections';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getSectionDetails = createAsyncThunk(
  'sections/getDetails',
  async (sectionId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await sectionService.getSectionDetails(sectionId, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get section details';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const removeStudentFromSection = createAsyncThunk(
  'sections/removeStudent',
  async ({ sectionId, studentId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      await sectionService.removeStudentFromSection(sectionId, studentId, token);
      return { sectionId, studentId };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to remove student';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  sections: [],
  availableSections: [],
  studentSections: [],
  currentSection: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: ''
};

const sectionSlice = createSlice({
  name: 'sections',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearCurrentSection: (state) => {
      state.currentSection = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Section
      .addCase(createSection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createSection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.sections.push(action.payload.data);
        state.message = 'Section created successfully';
      })
      .addCase(createSection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Teacher Sections
      .addCase(getTeacherSections.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTeacherSections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.sections = action.payload.data;
      })
      .addCase(getTeacherSections.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Available Sections
      .addCase(getAvailableSections.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAvailableSections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.availableSections = action.payload.data;
      })
      .addCase(getAvailableSections.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Join Section
      .addCase(joinSection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(joinSection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.studentSections.push(action.payload.data);
        // Remove from available sections
        state.availableSections = state.availableSections.filter(
          section => section._id !== action.payload.data._id
        );
        state.message = 'Successfully joined section';
      })
      .addCase(joinSection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Student Sections
      .addCase(getStudentSections.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStudentSections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.studentSections = action.payload.data;
      })
      .addCase(getStudentSections.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Section Details
      .addCase(getSectionDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSectionDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentSection = action.payload.data;
      })
      .addCase(getSectionDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Remove Student
      .addCase(removeStudentFromSection.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.message = 'Student removed successfully';
        // Update current section if it's loaded
        if (state.currentSection) {
          state.currentSection.students = state.currentSection.students.filter(
            student => student._id !== action.payload.studentId
          );
        }
        // Update sections list
        const section = state.sections.find(s => s._id === action.payload.sectionId);
        if (section) {
          section.students = section.students.filter(
            student => student._id !== action.payload.studentId
          );
        }
      })
      .addCase(removeStudentFromSection.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset, clearCurrentSection } = sectionSlice.actions;
export default sectionSlice.reducer;
