import axios from 'axios';

const MANUAL_TIMEOUT = 120000;

export const axiosForceTimeout: typeof axios.request = ((config) => {
  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
  }, MANUAL_TIMEOUT);
  return axios.request({ ...config, signal: abortController.signal }).finally(() => {
    clearTimeout(timeout);
  });
}) as never as typeof axios.request;
