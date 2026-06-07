// components/LoadingScreen.tsx
import { ECGAnimation } from './ECGAnimation'

interface LoadingScreenProps {
  message?: string
  subMessage?: string
  fullScreen?: boolean
}

export const LoadingScreen = ({
  message = 'Loading...',
  subMessage = 'Please wait while we prepare your workspace',
  fullScreen = true,
}: LoadingScreenProps) => {
  return (
    <div
      style={{
        position: fullScreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: fullScreen ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: fullScreen ? 'blur(8px)' : 'none',
        zIndex: fullScreen ? 9999 : 'auto',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '2rem',
          maxWidth: 400,
          width: '100%',
        }}
      >
        <div
          style={{
            background: '#E8F0F0',
            borderRadius: 20,
            padding: '20px 24px',
            marginBottom: '1.5rem',
            border: '1px solid #DCE5E5',
          }}
        >
          <ECGAnimation height={100} showLetters={true} speed={0.7} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 12,
              fontSize: 9,
              color: '#6B8A8C',
              letterSpacing: '0.5px',
            }}
          >
            <span>❤️ SYSTEM CHECK</span>
            <span>⚡ LOADING</span>
            <span>📊 SECURE</span>
          </div>
        </div>

        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#2C3E3F',
            marginBottom: 8,
            fontFamily: "'Playfair Display', serif",
          }}
        >
          {message}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: '#6B8A8C',
            marginBottom: 24,
          }}
        >
          {subMessage}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#5B8C8F',
                animation: `pulse-soft 1.5s ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}