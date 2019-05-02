import { appName } from '../config';
import { Map, fromJS } from 'immutable';
import { createSelector } from 'reselect';
import { takeEvery, call, put, all, select } from 'redux-saga/effects';
import { replace } from 'connected-react-router';
import api from '../services/api';

import { toast } from 'react-toastify';
import { rejectError } from '../utils/rejectErrorHelper';

/**
 * Constants
 * */
export const moduleName = 'auth';
const prefix = `${appName}/${moduleName}`;

export const SIGN_IN_REQUEST = `${prefix}/SIGN_IN_REQUEST`;
export const SIGN_IN_SUCCESS = `${prefix}/SIGN_IN_SUCCESS`;
export const SIGN_IN_ERROR = `${prefix}/SIGN_IN_ERROR`;
export const SIGN_UP_REQUEST = `${prefix}/SIGN_UP_REQUEST`;
export const SIGN_UP_SUCCESS = `${prefix}/SIGN_UP_SUCCESS`;
export const SIGN_UP_ERROR = `${prefix}/SIGN_UP_ERROR`;
export const LOAD_USER_REQUEST = `${prefix}/LOAD_USER_REQUEST`;
export const LOAD_USER_SUCCESS = `${prefix}/LOAD_USER_SUCCESS`;
export const LOAD_USER_ERROR = `${prefix}/LOAD_USER_ERROR`;
export const SIGN_OUT_REQUEST = `${prefix}/SIGN_OUT_REQUEST`;
export const SIGN_OUT_SUCCESS = `${prefix}/SIGN_OUT_SUCCESS`;
export const SIGN_OUT_ERROR = `${prefix}/SIGN_OUT_ERROR`;

export const ADD_MEETUP_TO_USER_REQUEST = `${prefix}/ADD_MEETUP_TO_USER_REQUEST`;
export const ADD_MEETUP_TO_USER_SUCCESS = `${prefix}/ADD_MEETUP_TO_USER_SUCCESS`;
export const ADD_MEETUP_TO_USER_ERROR = `${prefix}/ADD_MEETUP_TO_USER_ERROR`;

export const DELETE_MEETUP_FROM_USER_SUCCESS = `${prefix}/REMOVE_MEETUP_FROM_USER_SUCCESS`;

/**
 * Reducer
 * */
export const ReducerRecord = fromJS({
  user: null,
  error: null,
  isAuthenticated: false,
  isLoading: true
});

export default function reducer(state = ReducerRecord, action) {
  const { type, payload } = action;

  switch (type) {
    case SIGN_IN_REQUEST:
    case SIGN_UP_REQUEST:
      return state.set('isLoading', true);

    case SIGN_UP_SUCCESS:
      return (
        state
          // .merge({ user: new Map(payload.user) })
          .set('user', fromJS(payload.data))
          .set('isLoading', false)
          .set('isAuthenticated', true)
          .set('error', null)
      );

    case SIGN_IN_SUCCESS:
      return (
        state
          // .set('user', payload.data)
          // .merge({ user: new Map(payload.user) })
          .set('user', fromJS(payload.data))
          .set('error', null)
          .set('isLoading', false)
          .set('isAuthenticated', true)
      );

    case LOAD_USER_SUCCESS:
      return state
        .merge({ user: fromJS(payload.data) })
        .set('error', null)
        .set('isLoading', false)
        .set('isAuthenticated', true);

    case SIGN_OUT_SUCCESS:
      return state
        .set('isLoading', false)
        .set('isAuthenticated', false)
        .set('user', null);

    case SIGN_IN_ERROR:
    case SIGN_UP_ERROR:
    case LOAD_USER_ERROR:
      return state.set('error', payload.error).set('isLoading', false);

    case ADD_MEETUP_TO_USER_SUCCESS:
      // return state.getIn(['user', 'joinedMeetups']).push(payload.data);
      return state
        .updateIn(['user', 'joinedMeetups'], (joinedMeetups) =>
          joinedMeetups.push(payload.id)
        )
        .set('error', null)
        .set('isLoading', false);

    case DELETE_MEETUP_FROM_USER_SUCCESS:
      return state
        .updateIn(['user', 'joinedMeetups'], (joinedMeetups) =>
          joinedMeetups.filter((meetupId) => meetupId !== payload.id)
        )
        .set('error', null)
        .set('isLoading', false);

    default:
      return state;
  }
}

/**
 * Selectors
 * */

export const stateSelector = (state) => state[moduleName];

export const authErrorSelector = createSelector(
  stateSelector,
  (state) => state.error
);

export const isAuthenticatedSelector = createSelector(
  stateSelector,
  (state) => state.get('isAuthenticated')
);

export const userSelector = createSelector(
  stateSelector,
  (state) => {
    const user = state.get('user');
    return user ? user.toJS() : null;
  }
);

export const toastMessageSelector = createSelector(
  stateSelector,
  (state) => {
    const message = state.get('toastMessage');
    return message ? message : null;
  }
);

export const authUserSelector = createSelector(
  stateSelector,
  (state) => state.get('user')
);

/**
 * Action Creators
 * */

export const registerUser = (userData) => {
  return {
    type: SIGN_UP_REQUEST,
    payload: { userData }
  };
};

export const loginUser = (userData) => {
  return {
    type: SIGN_IN_REQUEST,
    payload: { userData }
  };
};

export const logoutUser = () => {
  localStorage.removeItem('react-meetuper');
  return {
    type: SIGN_OUT_REQUEST
  };
};

export const loadUser = () => {
  return {
    type: LOAD_USER_REQUEST
  };
};

/**
 * Sagas
 */

export function* registerSaga(action) {
  const {
    payload: { userData }
  } = action;
  try {
    const { data } = yield call(api.registerUser, userData);

    localStorage.setItem('react-meetuper', data.token);
    yield put({
      type: SIGN_UP_SUCCESS,
      payload: { data }
    });

    yield put(replace('/'));
    toast.success('You are registered ! =D');
  } catch (error) {
    console.log(error);
    localStorage.removeItem('react-meetuper');
    yield put({
      type: SIGN_UP_ERROR,
      payload: { error }
    });
    toast.error(rejectError(error));
  }
}

export function* loginSaga(action) {
  const {
    payload: { userData }
  } = action;

  try {
    const { data } = yield call(api.loginUser, userData);
    localStorage.setItem('react-meetuper', data.token);
    yield put({
      type: SIGN_IN_SUCCESS,
      payload: { data }
    });
    yield put(replace('/'));
    toast.success('You are logged in ! =D');
  } catch (error) {
    console.log(error);
    localStorage.removeItem('react-meetuper');
    yield put({
      type: SIGN_IN_ERROR,
      payload: { error }
    });
    toast.error(rejectError(error));
  }
}

export function* loadUserSaga() {
  try {
    const { data } = yield call(api.loadUser);

    yield put({
      type: LOAD_USER_SUCCESS,
      payload: { data }
    });
  } catch (error) {
    console.log(error);
    // localStorage.removeItem('react-meetuper');
    yield put({
      type: LOAD_USER_ERROR,
      payload: { error }
    });
  }
}

export function* logoutSaga() {
  try {
    yield call(api.logoutUser);

    yield put({
      type: SIGN_OUT_SUCCESS
    });
    localStorage.removeItem('react-meetuper');
    toast.warn('You are logged out');
  } catch (error) {
    console.log(error);
    localStorage.removeItem('react-meetuper');
    yield put({
      type: SIGN_OUT_ERROR,
      payload: { error }
    });
  }
}

export function* saga() {
  yield all([
    takeEvery(SIGN_UP_REQUEST, registerSaga),
    takeEvery(LOAD_USER_REQUEST, loadUserSaga),
    takeEvery(SIGN_IN_REQUEST, loginSaga),
    takeEvery(SIGN_OUT_REQUEST, logoutSaga)
  ]);
}
