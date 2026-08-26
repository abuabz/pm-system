import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

jest.mock('@/store/use-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockSetAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ setAuth: mockSetAuth });
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /Sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });

  it('submits form successfully and redirects', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        data: {
          accessToken: 'fake-token',
          user: { id: 'u1', email: 'test@test.com' },
        }
      }
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
      });
      expect(mockSetAuth).toHaveBeenCalledWith('fake-token', { id: 'u1', email: 'test@test.com' });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays API error on failure', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } }
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
