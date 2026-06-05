import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '1.2rem',
        color: 'var(--text-primary)',
        transition: 'all 0.2s ease',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 100,
      }}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      type="button"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
