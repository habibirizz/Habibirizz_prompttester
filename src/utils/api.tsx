  import axios, { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios';

  // Create an Axios instance
  const api = axios.create({
    baseURL: "https://api.habibirizz.app/",
    headers: {
      'Content-Type': 'application/json',
    },
  });

  api.interceptors.request.use((config:any) => {
    const token = localStorage.getItem('token');

    if (token && config.headers) {
      (config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
    }

    return config;
  });


  // ✅ GET request
  export const getApi = async (
    url: string,
    config: AxiosRequestConfig = {}
  ): Promise<AxiosResponse> => {
    return await api.get(url, config);
  };

  // ✅ POST request
  export const postApi = async (
    url: string,
    data: any,
    config: AxiosRequestConfig = {}
  ): Promise<AxiosResponse> => {
    return await api.post(url, data, config);
  };

  // ✅ PUT request
  export const putApi = async (
    url: string,
    data: any,
    config: AxiosRequestConfig = {}
  ): Promise<AxiosResponse> => {
    return await api.put(url, data, config);
  };

  // ✅ PATCH request
export const patchApi = async (
  url: string,
  data: any,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse> => {
  return await api.patch(url, data, config);
};

  // ✅ DELETE request
  export const deleteApi = async (
    url: string,
    config: AxiosRequestConfig = {}
  ): Promise<AxiosResponse> => {
    return await api.delete(url, config);
  };
