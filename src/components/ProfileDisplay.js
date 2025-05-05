import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { useWallet } from '../hooks/useWallet';

const ProfileDisplay = () => {
  const { account, profile, profileLoading } = useWallet();

  if (!account) {
    return <p>Please connect your wallet to view your profile.</p>;
  }

  if (profileLoading) {
    return (
      <div className="d-flex align-items-center">
        <Spinner animation="border" size="sm" className="me-2" />
        <span>Loading profile data...</span>
      </div>
    );
  }

  if (!profile) {
    return <p>No profile found for your account.</p>;
  }

  return (
    <Card className="mt-3">
      <Card.Header>Your Profile</Card.Header>
      <Card.Body>
        <div className="d-flex align-items-center">
          {profile.avatar && (
            <img 
              src={profile.avatar} 
              alt="Avatar" 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%',
                marginRight: '15px' 
              }} 
            />
          )}
          <div>
            <h5>{profile.username || 'Anonymous User'}</h5>
            <p className="text-muted">
              {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          </div>
        </div>
      </Card.Body>
      <Card.Footer className="text-muted">
        <small>Profile loaded from {profile._fromCache ? 'cache' : 'blockchain'}</small>
      </Card.Footer>
    </Card>
  );
};

export default ProfileDisplay; 