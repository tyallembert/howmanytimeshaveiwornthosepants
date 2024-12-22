import { User } from 'firebase/auth'
import Link from 'next/link'
import React from 'react'

type Props = {
    user: User | null
}

function Navigation({ user }: Props) {
  return (
    <div className='flex w-full backdrop-blur-sm bg-secondary/30 p-2 sticky top-0'>
        <p className='font-black text-lg'>HMTHI<span className='text-primary'>WTP</span></p>
        {
            user ? (
                <div>
                    
                </div>
            ): (
                <Link href={"/login"}>Login</Link>
            )
        }
    </div>
  )
}

export default Navigation