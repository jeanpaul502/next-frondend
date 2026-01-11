"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

type AccordionType = "single" | "multiple"

interface AccordionProps {
    type?: AccordionType
    collapsible?: boolean
    value?: string | string[]
    defaultValue?: string | string[]
    onValueChange?: (value: string | string[]) => void
    children: React.ReactNode
    className?: string
}

interface AccordionContextValue {
    type: AccordionType
    value: string | string[]
    collapsible: boolean
    onItemOpen: (value: string) => void
    onItemClose: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined)

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
    ({ type = "single", collapsible = false, value: propValue, defaultValue, onValueChange, children, className, ...props }, ref) => {
        const [value, setValue] = React.useState<string | string[]>(
            propValue ?? defaultValue ?? (type === "multiple" ? [] : "")
        )

        const isControlled = propValue !== undefined

        const currentValue = isControlled ? propValue : value

        const handleItemOpen = (itemValue: string) => {
            let newValue: string | string[]

            if (type === "single") {
                newValue = itemValue
            } else {
                // multiple
                const arrayValue = Array.isArray(currentValue) ? currentValue : []
                newValue = [...arrayValue, itemValue]
            }

            if (!isControlled) {
                setValue(newValue)
            }
            onValueChange?.(newValue)
        }

        const handleItemClose = (itemValue: string) => {
            let newValue: string | string[]

            if (type === "single") {
                if (collapsible) {
                    newValue = ""
                } else {
                    return // Cannot close if not collapsible and single
                }
            } else {
                const arrayValue = Array.isArray(currentValue) ? currentValue : []
                newValue = arrayValue.filter((v) => v !== itemValue)
            }

            if (!isControlled) {
                setValue(newValue)
            }
            onValueChange?.(newValue)
        }

        return (
            <AccordionContext.Provider
                value={{
                    type,
                    value: currentValue,
                    collapsible,
                    onItemOpen: handleItemOpen,
                    onItemClose: handleItemClose,
                }}
            >
                <div ref={ref} className={cn(className)} {...props}>
                    {children}
                </div>
            </AccordionContext.Provider>
        )
    }
)
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => {
    return (
        <div ref={ref} className={cn("border-b", className)} data-value={value} {...props}>
            {/* We pass the value to children via cloneElement or Context? 
          Actually Content and Trigger need to know the Item value. 
          Better to use another context for the Item.
      */}
            <AccordionItemContext.Provider value={{ value }}>
                {children}
            </AccordionItemContext.Provider>
        </div>
    )
})
AccordionItem.displayName = "AccordionItem"

const AccordionItemContext = React.createContext<{ value: string } | undefined>(undefined)

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const { value: itemValue } = React.useContext(AccordionItemContext)!
    const { value: selectedValue, type, onItemOpen, onItemClose } = React.useContext(AccordionContext)!

    const isOpen =
        type === "single"
            ? selectedValue === itemValue
            : Array.isArray(selectedValue) && selectedValue.includes(itemValue)

    const toggle = () => {
        if (isOpen) {
            onItemClose(itemValue)
        } else {
            onItemOpen(itemValue)
        }
    }

    return (
        <div className="flex">
            <button
                ref={ref}
                onClick={toggle}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                    className
                )}
                data-state={isOpen ? "open" : "closed"}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </button>
        </div>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { value: itemValue } = React.useContext(AccordionItemContext)!
    const { value: selectedValue, type } = React.useContext(AccordionContext)!

    const isOpen =
        type === "single"
            ? selectedValue === itemValue
            : Array.isArray(selectedValue) && selectedValue.includes(itemValue)

    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div
                        ref={ref}
                        className={cn("pb-4 pt-0", className)}
                        {...props}
                    >
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
