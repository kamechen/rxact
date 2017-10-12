import React from 'react'
import Observable from 'zen-observable'
import { shallow } from 'enzyme'
import setup from '../src/setup'
import teardown from '../src/teardown'
import createReactObserver from '../src/createReactObserver'
import StateStream from '../src/stateStream'

describe('createReactObserver', () => {
  beforeAll(() => {
    setup(Observable)
  })

  afterAll(() => {
    teardown()
  })

  it('throw if state$ is not instance of Observable', () => {
    expect(() =>
      createReactObserver(new StateStream('stream').state$)
    ).not.toThrow()

    expect(() =>
      createReactObserver()
    ).toThrow()

    expect(() =>
      createReactObserver('')
    ).toThrow()

    expect(() =>
      createReactObserver(1)
    ).toThrow()

    expect(() =>
      createReactObserver({})
    ).toThrow()

    expect(() =>
      createReactObserver(Symbol(''))
    ).toThrow()
  })

  it('set displayName', () => {
    const stream = new StateStream('stream', '')

    const Component = () => (
      <div>Test Component</div>
    )

    const Component2 = function component2() {
      return <div>Test Component2</div>
    }

    class Component3 extends React.Component {
      render() {
        return (<div>Test Component3</div>)
      }
    }

    class Component4 extends React.Component {
      static displayName =  'comp4'

      render() {
        return (<div>Test Component3</div>)
      }
    }

    const observer = stream.reactObserver

    expect(observer()(Component).displayName).toEqual('RxactObserver(Component)')
    expect(observer()(Component2).displayName).toEqual('RxactObserver(component2)')
    expect(observer()(Component3).displayName).toEqual('RxactObserver(Component3)')
    expect(observer()(Component4).displayName).toEqual('RxactObserver(comp4)')
  })

  it('passes state to component', () => {
    const Component = () => (
      <div>Test Component</div>
    )
    const state = { state: 'state' }
    const stream = new StateStream('stream', state)

    const Container = stream.reactObserver()(Component)

    const wrapper = shallow(<Container />)

    expect(wrapper.props()).toEqual(state)
  })

  it('use mapStateToProps to select state', () => {
    const Component = () => (
      <div>Test Component</div>
    )
    const state = { stateA: 'stateA', stateB: 'stateB' }
    const stream = new StateStream('stream', state)
    const mapStateToProps = state => ({ stateB: state.stateB })

    const Container = stream.reactObserver(mapStateToProps)(Component)

    const wrapper = shallow(<Container />)

    expect(wrapper.props()).toEqual({ stateB: 'stateB' })
  })

  it('use mergeProps to merge state and props', () => {
    const Component = () => (
      <div>Test Component</div>
    )
    const state = { stateA: 'stateA', stateB: 'stateB' }
    const stream = new StateStream('stream', state)
    const mergeProps = (state, props) => ({
      stateA: state.stateA,
      stateC: props.stateC,
    })

    const Container = stream.reactObserver(null, mergeProps)(Component)

    const wrapper = shallow(<Container stateC="stateC" />)

    expect(wrapper.props()).toEqual({
      stateA: 'stateA',
      stateC: 'stateC',
    })
  })

  it('observe all state when combining streams', () => {
    const Component = () => (
      <div>Test Component</div>
    )
    const stateA = { stateA: 'stateA' }
    const stateB = { stateB: 'stateB' }
    const stateC = { stateC: 'stateC' }
    const streamA = new StateStream('streamA', stateA)
    const streamB = new StateStream('streamB', stateB)
    const streamC = new StateStream('streamC', stateC, [streamA, streamB])

    const Container = streamC.reactObserver()(Component)

    const wrapper = shallow(<Container />)

    expect(wrapper.props()).toEqual({ streamA: stateA, streamB: stateB, streamC: stateC })
  })

  it('trigger rendering when receiving new state', () => {
    const Component = () => (
      <div>Test Component</div>
    )
    const stream = new StateStream('stream', { state: 'A' })

    const Container = stream.reactObserver()(Component)
    const wrapper = shallow(<Container />)

    expect(wrapper.props()).toEqual({ state: 'A' })

    stream.next(() => ({ state: 'B' }))

    expect(wrapper.props()).toEqual({ state: 'B' })
  })
})
