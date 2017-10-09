// @flow
import Rx from 'rxjs'
import createEventFactory from './createEventFactory'
import emitStateFactory from './emitStateFactory'
import createObserver from '../createObserver'

export type StateStream = {
  name: string,
  state$: Rx.Observable,
  observer: Function,
  getState?: Function,
  emitState?: Function,
}

export type Source = {
  name: string,
  state$: Rx.Observable,
}

const combineSources = (currentState$, name, inputSources) => {
  let state$ = currentState$

  if (inputSources && inputSources.length > 0) {
    const sourceNames = {}
    inputSources.forEach((source) => {
      if (typeof source !== 'object' || !source.name || !source.state$) {
        throw new Error('Expected the source to be type of StateStream.')
      }

      sourceNames[source.name] = 1
    })

    if (Object.keys(sourceNames).length !== inputSources.length) {
      throw new Error('Sources\' name should be unique.')
    }

    const sources = [...inputSources, { name, state$: currentState$ }]
    const states$ = sources.map(source => source.state$)
    state$ = Rx.Observable.combineLatest(...states$, (...states) => {
      let state = {}

      sources.forEach((source, index) => {
        state[source.name] = states[index]
      })

      return state
    })
  }

  return state$
}

const createStateStream = (
  name: string,
  initialState?: any,
  sources: Array<Source>,
): StateStream => {
  if (typeof name !== 'string' || !name) {
    throw new Error('Expected the name to be a not none string.')
  }

  const stateSource$ = Rx.Observable.create(() => {})
  const stateSubject = new Rx.BehaviorSubject(initialState)
  const currentState$ = stateSource$.multicast(stateSubject).refCount()

  const state$ = combineSources(currentState$, name, sources)

  return {
    name,
    createEvent: createEventFactory(stateSubject),
    emitState: emitStateFactory(stateSubject),
    getState: () => stateSubject.getValue(),
    state$,
    observer: createObserver(state$),
  }
}

export default createStateStream
