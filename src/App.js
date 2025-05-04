import {
  Link,
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";
import { Spinner, Navbar, Nav, Button, Container, Alert, Dropdown } from 'react-bootstrap'
import logo from './logo.png'
import Home from './Home.js'
import Profile from './Profile.js'
import Connect from './container/connect/Connect.js'
import { WalletProvider } from './context/WalletContext';
import { useWallet } from './hooks/useWallet';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { account, loading, initializing, isMetamaskInstalled, networkError } = useWallet();
  
  if (initializing || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" className="mb-3" />
          <p>Initializing wallet connection...</p>
        </div>
      </div>
    );
  }

  if (networkError) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Network Error</Alert.Heading>
          <p>{networkError}</p>
          <hr />
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </Alert>
      </Container>
    );
  }
  
  if (!isMetamaskInstalled) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>MetaMask Not Installed</Alert.Heading>
          <p>
            Please install MetaMask to use this application. 
            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="mx-2">
              Download MetaMask
            </a>
          </p>
        </Alert>
      </Container>
    );
  }

  // Only redirect to connect page if we're sure the user is not connected
  if (!account && !initializing && !loading) {
    return <Navigate to="/connect" />;
  }
  
  return children;
};

function AppNavbar() {
  const { account, connectWallet, disconnectWallet, isMetamaskInstalled, networkError } = useWallet();
  const navigate = useNavigate();
  
  const handleDisconnect = () => {
    disconnectWallet();
    navigate('/connect');
  };
  
  return (
    <Navbar expand="lg" bg="secondary" variant="dark">
      <Container>
        <Navbar.Brand href="/">
          <img src={logo} width="40" height="40" className="" alt="" />
          &nbsp; Decentratwitter
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
          </Nav>
          <Nav>
            {account ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" id="dropdown-basic">
                  {account.slice(0, 5) + '...' + account.slice(38, 42)}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item 
                    href={`https://etherscan.io/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Etherscan
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleDisconnect}>Disconnect</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : networkError ? (
              <Button 
                variant="outline-warning" 
                onClick={() => window.location.reload()} 
                title={networkError}
              >
                Network Error
              </Button>
            ) : isMetamaskInstalled ? (
              <Button onClick={connectWallet} variant="outline-light">Connect Wallet</Button>
            ) : (
              <Button 
                variant="outline-light" 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Install MetaMask
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

// Component to conditionally render navbar based on current route
const ConditionalNavbar = () => {
  const location = useLocation();
  const { initializing } = useWallet();
  
  // Don't show navbar during initialization or on connect page
  if (initializing || location.pathname === '/connect') {
    return null;
  }
  
  return <AppNavbar />;
};

function AppContent() {
  const { contract, loading, initializing, isMetamaskInstalled, networkError } = useWallet();
  
  return (
    <Routes>
      <Route path="/connect" element={
        initializing ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="text-center">
              <Spinner animation="border" className="mb-3" />
              <p>Initializing wallet connection...</p>
            </div>
          </div>
        ) : !isMetamaskInstalled ? (
          <Container className="mt-5">
            <Alert variant="danger">
              <Alert.Heading>MetaMask Not Installed</Alert.Heading>
              <p>
                Please install MetaMask to use this application. 
                <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="mx-2">
                  Download MetaMask
                </a>
              </p>
            </Alert>
          </Container>
        ) : (
          <Connect />
        )
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Home contract={contract} />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile contract={contract} />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <div className="App">
          <ConditionalNavbar />
          <AppContent />
        </div>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;