import React from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useAuth as useAppAuth } from '../contexts/AuthContext';
import { Container, Typography, Button, Card, CardContent } from '@mui/material';

const AuthTest = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken, sessionId } = useAuth();
  const { currentUser } = useAppAuth();

  const [backendStatus, setBackendStatus] = React.useState(null);

  const handleGetToken = async () => {
    try {
      const token = await getToken();
      console.log('Clerk Token (JWT):', token);
      console.log('Clerk Session ID:', sessionId);
      
      // Test backend authentication - pass Clerk session ID for verification
      const idToSend = sessionId || token;
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/auth/clerk-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToSend}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Backend Response:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/clerk-status');
      const data = await response.json();
      setBackendStatus(data);
    } catch (error) {
      console.error('Error checking backend status:', error);
      setBackendStatus({ configured: false, message: 'Backend not reachable' });
    }
  };

  React.useEffect(() => {
    checkBackendStatus();
  }, []);

  if (!isLoaded) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Clerk Authentication Test
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Clerk Status
          </Typography>
          <Typography>Is Signed In: {isSignedIn ? 'Yes' : 'No'}</Typography>
          <Typography>Is Loaded: {isLoaded ? 'Yes' : 'No'}</Typography>
          {user && (
            <>
              <Typography>Email: {user.primaryEmailAddress?.emailAddress}</Typography>
              <Typography>Name: {user.fullName}</Typography>
              <Typography>User ID: {user.id}</Typography>
            </>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            App Auth Context
          </Typography>
          <Typography>Current User: {currentUser ? 'Yes' : 'No'}</Typography>
          {currentUser && (
            <Typography>User Email: {currentUser.primaryEmailAddress?.emailAddress}</Typography>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Backend Configuration
          </Typography>
          {backendStatus ? (
            <>
              <Typography color={backendStatus.configured ? 'success.main' : 'error.main'}>
                Status: {backendStatus.configured ? 'Configured' : 'Not Configured'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {backendStatus.message}
              </Typography>
              {backendStatus.instructions && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {backendStatus.instructions}
                </Typography>
              )}
              {backendStatus.secret_key_preview && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Secret Key: {backendStatus.secret_key_preview}
                </Typography>
              )}
            </>
          ) : (
            <Typography>Checking backend status...</Typography>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Local Storage
          </Typography>
          <Typography>JWT Token: {localStorage.getItem('jwt_token') ? 'Present' : 'Not Present'}</Typography>
          <Typography>Clerk Token: {localStorage.getItem('clerk_token') ? 'Present' : 'Not Present'}</Typography>
          <Typography>User Email: {localStorage.getItem('userEmail') || 'Not Set'}</Typography>
          <Typography>User Name: {localStorage.getItem('userName') || 'Not Set'}</Typography>
        </CardContent>
      </Card>

      {isSignedIn && (
        <Button variant="contained" onClick={handleGetToken}>
          Test Backend Authentication
        </Button>
      )}
    </Container>
  );
};

export default AuthTest;