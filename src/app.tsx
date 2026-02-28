import React, { PropsWithChildren } from 'react'
import { CartProvider } from './store/CartContext'
import { UserProvider } from './store/UserContext'
import './app.scss'

function App({ children }: PropsWithChildren) {
  return (
    <UserProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </UserProvider>
  )
}

export default App
