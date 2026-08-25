import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatProjectString(str:string){
  return str.replace("-", " ")
}

export function getProjectName(str:string){
  return str.split("-").at(1)
}