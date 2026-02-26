import React, { PropsWithChildren } from 'react'
import { CartProvider } from './store/CartContext'
import './app.scss'

function App({ children }: PropsWithChildren) {
  return <CartProvider>{children}</CartProvider>
}

export default App
