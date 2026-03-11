import React, { PropsWithChildren } from 'react'
import { CartProvider } from './store/CartContext'
import { UserProvider } from './store/UserContext'
import { StoreProvider } from './store/StoreContext'
import './app.scss'

function App({ children }: PropsWithChildren) {
  return (
    <UserProvider>
      <StoreProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </StoreProvider>
    </UserProvider>
  )
}

export default App
