import React from 'react'
import { View, Text } from 'react-native'

interface BadgeProps {
    count: number
    variant?: 'primary' | 'success' | 'danger' | 'warning'
    size?: 'sm' | 'md' | 'lg'
}

const variantClasses = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-yellow-500',
}

const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
}

const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
}

export const Badge: React.FC<BadgeProps> = ({
    count,
    variant = 'primary',
    size = 'md',
}) => {
    if (count <= 0) return null

    const displayCount = count > 99 ? '99+' : count.toString()

    return (
        <View
            className={`${sizeClasses[size]} ${variantClasses[variant]} items-center justify-center rounded-full`}
        >
            <Text className={`${textSizeClasses[size]} font-bold text-white`}>
                {displayCount}
            </Text>
        </View>
    )
}
