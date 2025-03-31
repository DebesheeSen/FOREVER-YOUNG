"use client"

import * as React from "react"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Clock } from "lucide-react"

export function TimePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [time, setTime] = React.useState(value)

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = ['00', '15', '30', '45']

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <Clock className="mr-2 h-4 w-4" />
          {time || "Select time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="grid grid-cols-6 gap-1 p-2 max-h-60 overflow-auto">
          {hours.map((hour) => (
            minutes.map((minute) => (
              <Button
                key={`${hour}:${minute}`}
                variant="ghost"
                className={`h-8 w-12 p-0 text-xs ${time === `${hour}:${minute}` ? 'bg-accent' : ''}`}
                onClick={() => {
                  const newTime = `${hour}:${minute}`
                  setTime(newTime)
                  onChange(newTime)
                }}
              >
                {`${hour}:${minute}`}
              </Button>
            ))
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}