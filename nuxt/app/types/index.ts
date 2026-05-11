export interface Utente {
  id: number
  nome: string
  email: string
  citta: string
  sesso: 'M' | 'F' | 'Altro'
  codiceFiscale: string
  dataNascita: string | null
  telefono: string
  ruolo: 'utente' | 'admin'
  creatoIl: string
}

export interface Post {
  id: number
  userId: number
  titolo: string
  corpo: string
  creatoIl: string
}

export interface Commento {
  id: number
  postId: number
  nome: string
  email: string
  corpo: string
  creatoIl: string
}

export interface Meta {
  pagina: number
  limite: number
  totale: number
  pagine: number
}

export interface RispostaPaginata<T> {
  dati: T[]
  meta: Meta
}
