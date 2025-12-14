import React from 'react'
import soundManager from './Sound/SoundManager'
import Card from './Card'

interface GameStartProps {
  title: string
  subtitle?: string
  buttonText?: string
  buttonClassName?: string
  onStart: () => void
  playMusicOnStart?: boolean
}

const GameStart: React.FC<GameStartProps> = ({
  title,
  subtitle = 'E toata lumea gata?',
  buttonText = 'Start',
  buttonClassName = 'button',
  onStart,
  playMusicOnStart = true,
}) => {
  const handleStart = () => {
    if (playMusicOnStart) {
      soundManager.playMusic()
    }
    onStart()
  }

  return (
    <Card>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div className={buttonClassName} onClick={handleStart}>
        {buttonText}
      </div>
    </Card>
  )
}

export default GameStart
