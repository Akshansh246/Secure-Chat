import api from './api.js';
import { setCredentials, logOut, setError, setLoading } from '../store/slices/authSlice.js';
import { clearChat } from '../store/slices/chatSlice.js';

export const registerUser = (userData) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const response = await api.post('/auth/register', userData);
    const { user, accessToken, refreshToken, kyberPrivateKey } = response.data.data;

    dispatch(
      setCredentials({
        user,
        accessToken,
        refreshToken,
        kyberPrivateKey,
      })
    );
    return user;
  } catch (error) {
    const message = error.response?.data?.message || 'Registration failed';
    dispatch(setError(message));
    throw new Error(message);
  } finally {
    dispatch(setLoading(false));
  }
};

export const loginUser = (credentials) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const response = await api.post('/auth/login', credentials);
    const { user, accessToken, refreshToken, kyberPrivateKey } = response.data.data;

    dispatch(
      setCredentials({
        user,
        accessToken,
        refreshToken,
        kyberPrivateKey,
      })
    );
    return user;
  } catch (error) {
    const message = error.response?.data?.message || 'Login failed';
    dispatch(setError(message));
    throw new Error(message);
  } finally {
    dispatch(setLoading(false));
  }
};

export const logoutUser = () => async (dispatch, getState) => {
  const { refreshToken } = getState().auth;
  try {
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } catch (error) {
    console.error('Logout API request failed:', error);
  } finally {
    dispatch(logOut());
    dispatch(clearChat());
  }
};

export const checkAuth = () => async (dispatch) => {
  try {
    const response = await api.get('/users/me');
    const { user } = response.data.data;
    // Update local storage user details
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    // If getting profile fails (e.g. token expired and couldn't refresh), logout
    dispatch(logOut());
    dispatch(clearChat());
  }
};
