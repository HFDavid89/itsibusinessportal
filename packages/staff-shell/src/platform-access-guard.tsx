'use client';

import { useAuth } from './auth-context';
import { LoadingSpinner } from '@itsi-business/ui';
import { AccessRestricted, UNAUTHORISED_PAGE_MESSAGE } from './access-restricted';

export function PlatformAccessGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!user || user.realm !== 'platform') {
    return <AccessRestricted message={UNAUTHORISED_PAGE_MESSAGE} />;
  }

  return <>{children}</>;
}
