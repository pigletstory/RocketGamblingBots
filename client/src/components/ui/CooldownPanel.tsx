import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Progress } from './progress';

export default function CooldownPanel() {
  const { 
    user, 
    canUseDaily, 
    canUseWork, 
    dailyCooldownRemaining, 
    workCooldownRemaining 
  } = useUser();
  
  const [remainingTime, setRemainingTime] = useState({
    daily: '',
    work: ''
  });
  
  const [progressPercentage, setProgressPercentage] = useState({
    daily: 0,
    work: 0
  });
  
  // Update cooldown timer every second
  useEffect(() => {
    const updateCooldowns = () => {
      // Calculate remaining time for daily command
      if (dailyCooldownRemaining > 0) {
        const hours = Math.floor(dailyCooldownRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((dailyCooldownRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        setRemainingTime(prev => ({
          ...prev,
          daily: `${hours}:${minutes < 10 ? '0' : ''}${minutes} remaining`
        }));
        
        // Calculate progress (24 hours total)
        const dailyProgress = 100 - (dailyCooldownRemaining / (24 * 60 * 60 * 1000) * 100);
        setProgressPercentage(prev => ({
          ...prev,
          daily: dailyProgress
        }));
      } else {
        setRemainingTime(prev => ({
          ...prev,
          daily: ''
        }));
        setProgressPercentage(prev => ({
          ...prev,
          daily: 100
        }));
      }
      
      // Calculate remaining time for work command
      if (workCooldownRemaining > 0) {
        const minutes = Math.floor(workCooldownRemaining / (1000 * 60));
        const seconds = Math.floor((workCooldownRemaining % (1000 * 60)) / 1000);
        
        setRemainingTime(prev => ({
          ...prev,
          work: `${minutes}:${seconds < 10 ? '0' : ''}${seconds} remaining`
        }));
        
        // Calculate progress (10 minutes total)
        const workProgress = 100 - (workCooldownRemaining / (10 * 60 * 1000) * 100);
        setProgressPercentage(prev => ({
          ...prev,
          work: workProgress
        }));
      } else {
        setRemainingTime(prev => ({
          ...prev,
          work: ''
        }));
        setProgressPercentage(prev => ({
          ...prev,
          work: 100
        }));
      }
    };
    
    // Initial update
    updateCooldowns();
    
    // Set interval to update every second
    const interval = setInterval(updateCooldowns, 1000);
    
    return () => clearInterval(interval);
  }, [dailyCooldownRemaining, workCooldownRemaining, canUseDaily, canUseWork]);
  
  if (!user) {
    return (
      <div className="bg-discord-darker rounded-lg p-4 shadow-lg animate-pulse">
        <h2 className="text-xl font-semibold mb-3">Command Cooldowns</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-discord-light rounded-md p-3 h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-discord-darker rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-3">Command Cooldowns</h2>
      <div className="space-y-3">
        <div className="bg-discord-light rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">/daily</span>
            <span className={canUseDaily ? "text-casino-green text-sm" : "text-discord-muted text-sm"}>
              {canUseDaily ? 'Ready' : remainingTime.daily}
            </span>
          </div>
          <div className="w-full bg-discord-darkest rounded-full h-2 mt-2">
            <Progress value={progressPercentage.daily} className={canUseDaily ? "bg-casino-green" : "bg-casino-purple"} />
          </div>
        </div>
        <div className="bg-discord-light rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">/work</span>
            <span className={canUseWork ? "text-casino-green text-sm" : "text-discord-muted text-sm"}>
              {canUseWork ? 'Ready' : remainingTime.work}
            </span>
          </div>
          <div className="w-full bg-discord-darkest rounded-full h-2 mt-2">
            <Progress value={progressPercentage.work} className={canUseWork ? "bg-casino-green" : "bg-casino-purple"} />
          </div>
        </div>
        <div className="bg-discord-light rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">/vote</span>
            <span className="text-casino-green text-sm">Ready</span>
          </div>
          <div className="w-full bg-discord-darkest rounded-full h-2 mt-2">
            <Progress value={100} className="bg-casino-green" />
          </div>
        </div>
      </div>
    </div>
  );
}
