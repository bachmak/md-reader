import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.get(
  '/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

router.get(
  '/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

router.get('/me', (req, res) => {
  res.json(req.user || null);
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

export default router;
