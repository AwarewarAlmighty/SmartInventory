import admin from "firebase-admin";

// Mock Firebase token verification for development
// In production, you would use proper Firebase Admin SDK with service account
export const verifyFirebaseToken = async (idToken: string) => {
  try {
    // For development purposes, we'll skip actual Firebase verification
    // and just decode the JWT payload to get user info
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Mock decoded token structure
    const mockDecodedToken = {
      uid: `mock_uid_${Date.now()}`,
      email: "user@example.com",
      name: "Google User",
      aud: "inventory-management-elice",
      iss: "https://securetoken.google.com/inventory-management-elice",
      sub: `mock_uid_${Date.now()}`,
    };
    
    return mockDecodedToken;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    throw new Error("Invalid Firebase token");
  }
};

export { admin };