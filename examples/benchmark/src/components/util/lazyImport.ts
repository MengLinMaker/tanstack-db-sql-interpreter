import { lazy } from 'solid-js'

type LazyFactory<T> = () => Promise<{ default: T }>

export const lazyImport = <T>(factory: LazyFactory<T>) => lazy(factory as never)
