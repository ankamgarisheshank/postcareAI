import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const useFetch = (url, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { immediate = true, params = {} } = options;

    const fetchData = useCallback(async (overrideParams) => {
        try {
            setLoading(true);
            setError(null);
            const { data: response } = await api.get(url, { params: overrideParams || params });
            setData(response);
            return response;
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        if (immediate) {
            fetchData();
        }
    }, [url]);

    return { data, loading, error, refetch: fetchData };
};

export default useFetch;
