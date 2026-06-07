import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs) { return twMerge(clsx(inputs)) }
export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const WS  = import.meta.env.VITE_API_WS_URL || 'ws://localhost:8000'
