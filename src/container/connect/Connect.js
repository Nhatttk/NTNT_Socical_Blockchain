import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useWallet } from '../../hooks/useWallet';
import logo from '../../logo.png';
import './Connect.css';

const Connect = () => {
  const { account, connectWallet, isMetamaskInstalled, networkError, initializing, loading } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already connected, redirect to home
    if (account && !initializing) {
      navigate('/');
    }
  }, [account, navigate, initializing]);

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success) {
      navigate('/');
    }
  };

  const handleBackToHome = () => {
    if (account) {
      navigate('/');
    }
  };

  // Show loading spinner while initializing
  if (initializing) {
    return (
      <div className="connect-page d-flex align-items-center justify-content-center">
        <div className="text-center">
          <Spinner animation="border" className="mb-3" />
          <p>Initializing wallet connection...</p>
        </div>
      </div>
    );
  }

  if (!isMetamaskInstalled) {
    return (
      <div className="connect-page">
        <Container className="mt-5">
          <Row className="justify-content-center">
            <Col md={6} className="text-center connect-container">
              <img src={logo} width="100" height="100" className="connect-logo" alt="Logo" />
              <h1 className="connect-title">MetaMask Not Installed</h1>
              <p className="mb-4">
                You need to install MetaMask browser extension to use Decentratwitter.
              </p>
              <Button 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                variant="primary" 
                size="lg"
                className="connect-btn"
              >
                Install MetaMask
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="connect-page">
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center connect-container">
            <img src={logo} width="120" height="120" className="connect-logo" alt="Logo" />
            <h1 className="connect-title">Welcome to Decentratwitter</h1>
            
            {networkError && (
              <Alert variant="danger" className="mb-4">
                <strong>Connection Error: </strong>{networkError}
              </Alert>
            )}
            
            <p className="mb-4">
              Connect your wallet to access the decentralized social platform.
            </p>
            <Button 
              onClick={handleConnect} 
              variant="primary" 
              size="lg"
              className="connect-btn w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
            
            {account && (
              <Button 
                onClick={handleBackToHome}
                variant="link" 
                className="mt-3"
              >
                Back to Home
              </Button>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Connect; 