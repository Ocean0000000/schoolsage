export function validateCredentials(email: string, password: string): string | null {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!email || !password) {
		return 'Email and password are required.';
	}
	if (!emailRegex.test(email)) {
		return 'Invalid email address format.';
	} else if (
		password.length < 8 ||
		!/[A-Z]/.test(password) ||
		!/[a-z]/.test(password) ||
		!/\d/.test(password)
	) {
		return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.';
	} else {
		return null;
	}
}
