import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

export function useLocationStateSync(key, value) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(location.pathname + location.search, {
      replace: true,
      state: { [key]: value },
      preventScrollReset: true,
    });
  }, [navigate, location.pathname, location.search, key, value]);
}
