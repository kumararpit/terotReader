import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import { LAUNCH_DATE_UTC, REDIRECT_URL } from '../config/launchConfig';
import Confetti from './Confetti';

// Extend dayjs plugins
dayjs.extend(duration);
dayjs.extend(utc);

// Configuration Constants
const DEFAULT_LAUNCH_DATE_UTC = LAUNCH_DATE_UTC;
const DEFAULT_REDIRECT_URL = REDIRECT_URL;

const TimeBox = ({ value, label }) => {
    return (
        <div className="flex flex-col items-center justify-center bg-card text-card-foreground p-4 md:p-6 rounded-lg shadow-md border border-border/50 min-w-[100px] md:min-w-[140px] transition-transform hover:scale-105 duration-300">
            <span className="text-3xl md:text-5xl font-bold font-body text-primary tabular-nums animate-in fade-in zoom-in duration-300" key={value}>
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs md:text-sm uppercase tracking-wider text-muted-foreground mt-2 font-medium">
                {label}
            </span>
        </div>
    );
};

const LaunchCountdown = ({
    targetDate = DEFAULT_LAUNCH_DATE_UTC,
    redirectUrl = DEFAULT_REDIRECT_URL,
    title = "Something Magical is Coming"
}) => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [isExploding, setIsExploding] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = dayjs().utc();
            const target = dayjs(targetDate).utc();
            const diff = target.diff(now);

            if (diff <= 0) {
                // If not already exploding, trigger explosion
                if (!isExploding) {
                    setIsExploding(true);
                    // Wait for animation before redirect
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 1000); // 4 seconds of glory
                }
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            const durationObj = dayjs.duration(diff);

            return {
                days: Math.floor(durationObj.asDays()),
                hours: durationObj.hours(),
                minutes: durationObj.minutes(),
                seconds: durationObj.seconds()
            };
        };

        // Initial calculation
        const initialTime = calculateTimeLeft();
        if (initialTime) setTimeLeft(initialTime);

        // If already exploding, don't set interval
        if (isExploding) return;

        const timer = setInterval(() => {
            const time = calculateTimeLeft();
            if (time) {
                setTimeLeft(time);
            } else {
                // Logic handled in calculateTimeLeft when diff <= 0
                // But we need to ensure we clear interval if it returns 0/null and we are exploding
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, redirectUrl, navigate, isExploding]);

    return (
        <section className="w-full py-12 md:py-20 bg-background relative overflow-hidden" aria-label="Launch Countdown">
            <Confetti isActive={isExploding} />
            <div className="max-w-4xl mx-auto px-4 flex flex-col items-center justify-center space-y-8 md:space-y-12 relative z-10">

                {/* Heading */}
                <div className="text-center space-y-4">
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
                        {title}
                    </h2>
                    <div className="h-1 w-20 bg-accent mx-auto rounded-full"></div>
                </div>

                {/* Countdown Grid/Flex */}
                <div className="grid grid-cols-2 md:flex md:flex-row gap-4 md:gap-8 w-full justify-center" aria-live="polite">
                    <TimeBox value={timeLeft.days} label="Days" />
                    <TimeBox value={timeLeft.hours} label="Hours" />
                    <TimeBox value={timeLeft.minutes} label="Minutes" />
                    <TimeBox value={timeLeft.seconds} label="Seconds" />
                </div>

                {/* Optional Message */}
                <p className="text-center text-muted-foreground max-w-lg mx-auto">
                    We are crafting a new experience for you. Stay tuned for the divine reveal.
                </p>
            </div>
        </section>
    );
};

export default LaunchCountdown;
