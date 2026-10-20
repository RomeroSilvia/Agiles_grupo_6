import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

export function useLinkToken() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get('token'));

  useEffect(() => {
    if (location.hash) {
      navigate({ pathname: location.pathname, search: location.search }, { replace: true });
    }
  }, [location, navigate]);

  return token;
}
