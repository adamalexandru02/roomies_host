import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import soundManager from './Sound/SoundManager'

interface ProgressBarProps {
  timeInSeconds: number
  callback: () => void
  playTickSound?: boolean
}

export interface ProgressBarHandle {
  reset: () => void
}

const ProgressBar = forwardRef<ProgressBarHandle, ProgressBarProps>(
  ({ timeInSeconds, callback, playTickSound = false }, ref) => {
    const [timer, setTimer] = useState(timeInSeconds * 1000)

    function resetProgress() {
      setTimer(timeInSeconds * 1000)
    }

    useImperativeHandle(ref, () => ({
      reset: resetProgress,
    }))

    useEffect(() => {
      const interval = setInterval(() => {
        setTimer((t) => {
          if (playTickSound) {
            if (t % 2 === 0) {
              soundManager.playSound('tic')
            } else {
              soundManager.playSound('tac')
            }
          }

          if (t >= 1000) {
            return t - 1000
          } else {
            console.log('gata:', t)
            clearInterval(interval)
            callback()
            return 0
          }
        })
      }, 1000)

      return () => clearInterval(interval)
    }, [callback, playTickSound])

    return (
      <>
        <div className="timer">{timer / 1000}</div>
        <div className="progress-bar">
          <div
            className="progress"
            style={{ width: `${timer / (timeInSeconds * 10)}%` }}
          ></div>
        </div>
      </>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'

export default ProgressBar
