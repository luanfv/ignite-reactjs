import { createContext, ReactNode, useEffect, useState } from 'react';
import Router from 'next/router';
import { destroyCookie, parseCookies, setCookie } from 'nookies';

import { api } from '../services/api';

type IUser = {
  email: string;
  permissions: string[];
  roles: string[];
}

type ISignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  isAuthenticated: boolean;
  user: IUser | undefined;
  signIn(credentials: ISignInCredentials): Promise<void>;
}

type AuthProviderProps = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);


export const signOut = () => {
  destroyCookie(undefined, 'nextauth.token');
  destroyCookie(undefined, 'nextauth.refreshToken');


  Router.push('/');
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<IUser>();
  const isAuthenticated = !!user;

  useEffect(() => {
    const { 'nextauth.token': token } = parseCookies();

    if (token) {
      api.get('/me').then((response) => {
        const { email, permissions, roles } = response.data;

        setUser({
          email,
          permissions,
          roles,
        })
      }).catch(() => {
        signOut();
      });
    }
  }, []);

  const signIn = async ({ email, password }: ISignInCredentials) => {
    try {
      const response = await api.post('/sessions', {
        email,
        password,
      });

      const { token, refreshToken, permissions, roles } = response.data;
  
      setCookie(
        undefined,
        'nextauth.token',
        token,
        {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        },
      );

      setCookie(
        undefined,
        'nextauth.refreshToken',
        refreshToken,
        {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        },
      );

      setUser({
        email,
        permissions,
        roles,
      });

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      Router.push('/dashboard');
    } catch (err) {
      console.log(err);
    }
  }
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, signIn }}>
      {children}
    </AuthContext.Provider>
  )
}