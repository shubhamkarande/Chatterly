import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
    signIn as firebaseSignIn,
    signUp as firebaseSignUp,
    signOut as firebaseSignOut,
    getUserById,
    updateUserProfile as firebaseUpdateProfile
} from '../services/firebase';
import { AuthState, User } from '../types';

const initialState: AuthState = {
    user: null,
    token: null,
    loading: false,
    error: null,
    initialized: false,
};

// Async thunks
export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const firebaseUser = await firebaseSignIn(email, password);
            const token = await firebaseUser.getIdToken();
            const userData = await getUserById(firebaseUser.uid);

            const user: User = {
                uid: firebaseUser.uid,
                name: userData?.name || firebaseUser.displayName || '',
                email: firebaseUser.email || '',
                photoURL: userData?.photoURL || firebaseUser.photoURL,
                online: true,
            };

            return { user, token };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Login failed');
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async ({ email, password, name }: { email: string; password: string; name: string }, { rejectWithValue }) => {
        try {
            const firebaseUser = await firebaseSignUp(email, password, name);
            const token = await firebaseUser.getIdToken();

            const user: User = {
                uid: firebaseUser.uid,
                name: name,
                email: email,
                photoURL: null,
                online: true,
            };

            return { user, token };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Registration failed');
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await firebaseSignOut();
        } catch (error: any) {
            return rejectWithValue(error.message || 'Logout failed');
        }
    }
);

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async ({ uid, data }: { uid: string; data: Partial<User> }, { rejectWithValue }) => {
        try {
            await firebaseUpdateProfile(uid, data);
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Profile update failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<{ user: User | null; token: string | null }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.initialized = true;
        },
        setInitialized: (state, action: PayloadAction<boolean>) => {
            state.initialized = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        updateOnlineStatus: (state, action: PayloadAction<boolean>) => {
            if (state.user) {
                state.user.online = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        // Login
        builder.addCase(login.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(login.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.initialized = true;
        });
        builder.addCase(login.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Register
        builder.addCase(register.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(register.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.initialized = true;
        });
        builder.addCase(register.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Logout
        builder.addCase(logout.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(logout.fulfilled, (state) => {
            state.loading = false;
            state.user = null;
            state.token = null;
        });
        builder.addCase(logout.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Update Profile
        builder.addCase(updateProfile.fulfilled, (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        });
    },
});

export const { setUser, setInitialized, clearError, updateOnlineStatus } = authSlice.actions;
export default authSlice.reducer;
