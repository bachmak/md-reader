import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import db from '../db.js';
import { User } from '../types.js';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface User {
      id: string;
      googleId: string;
      email: string;
      createdAt: number;
    }
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.APP_URL}/auth/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value || '';
      const googleId = profile.id;

      try {
        let user = db
          .prepare('SELECT * FROM users WHERE googleId = ?')
          .get(googleId) as User | undefined;

        if (!user) {
          const userId = crypto.randomUUID();
          db.prepare(
            'INSERT INTO users (id, googleId, email, createdAt) VALUES (?, ?, ?, ?)'
          ).run(userId, googleId, email, Date.now());
          user = { id: userId, googleId, email, createdAt: Date.now() };
        }

        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  try {
    const user = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as User | undefined;
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  next();
}

export function requireAuthOrApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user) return next();

  const apiKey = process.env.API_KEY;
  const authHeader = req.headers.authorization;
  if (apiKey && authHeader === `Bearer ${apiKey}`) {
    const user = db.prepare('SELECT * FROM users LIMIT 1').get() as User | undefined;
    if (user) {
      req.user = user;
      return next();
    }
  }

  res.status(401).json({ error: 'Not authenticated' });
}
