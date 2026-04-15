// Clerk configuration
export const clerkConfig = {
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.REACT_APP_CLERK_PUBLISHABLE_KEY,
  appearance: {
    theme: {
      primaryColor: '#2196f3',
      primaryColorText: '#ffffff',
    },
    variables: {
      colorPrimary: '#2196f3',
      colorText: '#ffffff',
      colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
      colorBackground: '#121212',
      colorInputBackground: '#1e1e1e',
      colorInputText: '#ffffff',
      borderRadius: '8px',
    },
    elements: {
      formButtonPrimary: {
        backgroundColor: '#2196f3',
        '&:hover': {
          backgroundColor: '#1565c0',
        },
      },
      card: {
        backgroundColor: '#1e1e1e',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      },
      headerTitle: {
        color: '#ffffff',
      },
      headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
      },
      socialButtonsBlockButton: {
        backgroundColor: '#1e1e1e',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#ffffff',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
      },
      formFieldInput: {
        backgroundColor: '#1e1e1e',
        border: '1px solid rgba(255, 255, 255, 0.23)',
        color: '#ffffff',
        '&:focus': {
          borderColor: '#2196f3',
        },
      },
      formFieldLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
      },
      footerActionLink: {
        color: '#2196f3',
      },
    },
  },
};