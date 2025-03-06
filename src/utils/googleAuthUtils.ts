export async function getUserGoogleData(accessToken: string): Promise<any> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    );
    return await response.json();
  } catch (error: any) {
    return null;
  }
}
