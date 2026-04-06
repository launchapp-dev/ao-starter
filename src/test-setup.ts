// Disable ANSI color codes during tests so string assertions work consistently
// regardless of CI environment (GitHub Actions sets FORCE_COLOR=1)
process.env.NO_COLOR = '1';
