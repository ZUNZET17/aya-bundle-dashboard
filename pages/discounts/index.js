import { Disclosure, Menu, Transition, Dialog, Listbox } from '@headlessui/react'
import { BellIcon, MenuIcon, XIcon, TrashIcon } from '@heroicons/react/outline'
import { useRouter } from 'next/router';
import { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import nookies from 'nookies';
import { parseCookies, setCookie }  from 'nookies'
import { fetchDiscounts } from '../../lib/utils'
import { shopifyGqlRequest, loadSearchResults } from '../../lib/shopify'
import Link from 'next/link';
import { storesInfo } from '../../data/storesInfo';

const user = {
  name: 'Aya admin',
  email: 'aya@ayabundles.com',
  imageUrl:
    'https://cdn.shopify.com/s/files/1/0550/2880/9974/files/AYA_Favicon_Black_735a80f1-36e8-4dcb-85b0-1d3eab7cb5eb.png?v=1652727651&width=180',
}
const navigation = [
  { name: 'Dashboard', href: '#', current: true },
  { name: 'Team', href: '#', current: false },
  { name: 'Projects', href: '#', current: false },
  { name: 'Calendar', href: '#', current: false },
  { name: 'Reports', href: '#', current: false },
]
const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
]

let stores = []

for (let store in storesInfo) {
  stores.push(storesInfo[store])
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const logout = async () => {
  try {
    await axios.get('/api/logout');
    router.push('/');
  } catch (e) {
    console.log(e);
  }
}

export default function Discounts() {

  const discountsArray = stores.map( (s, i) => {
    return (
      <div key={i} className="px-4 py-2 sm:px-0">
        <Link href={'/discounts/' + s.endpoint}>
          <div className="bg-slate-400 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 cursor-pointer hover:bg-slate-200">
            <dt className="text-sm font-medium text-black">{i + 1}</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0"><strong>Store:</strong> <br/>{s.store_name}</dd>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0"><strong>Store Endpoint:</strong> <br/>{s.endpoint}</dd>
          </div>
        </Link>
      </div>
    )
  });
  
  return (
    <>
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-gray-800">
          {({ open }) => (
            <>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="h-8 w-8"
                        src="https://tailwindui.com/img/logos/workflow-mark-indigo-500.svg"
                        alt="Workflow"
                      />
                    </div>
                    <div className="hidden md:block">
                      <div className="ml-10 flex items-baseline space-x-4">
                        {navigation.map((item) => (
                          <a
                            key={item.name}
                            href={item.href}
                            className={classNames(
                              item.current
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                              'px-3 py-2 rounded-md text-sm font-medium'
                            )}
                            aria-current={item.current ? 'page' : undefined}
                          >
                            {item.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-4 flex items-center md:ml-6">
                      <button
                        type="button"
                        className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                      >
                        <span className="sr-only">View notifications</span>
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                      </button>

                      {/* Profile dropdown */}
                      <Menu as="div" className="ml-3 relative">
                        <div>
                          <Menu.Button className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                            <span className="sr-only">Open user menu</span>
                            <img className="h-8 w-8 rounded-full" src={user.imageUrl} alt="" />
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {userNavigation.map((item) => (
                              <Menu.Item key={item.name}>
                                {({ active }) => (
                                  <a
                                    href={item.href}
                                    className={classNames(
                                      active ? 'bg-gray-100' : '',
                                      'block px-4 py-2 text-sm text-gray-700'
                                    )}
                                  >
                                    {item.name}
                                  </a>
                                )}
                              </Menu.Item>
                            ))}
                              <Menu.Item key="Log out">
                                {({ active }) => (
                                  <a
                                    onClick={logout}
                                    className={classNames(
                                      active ? 'bg-gray-100' : '',
                                      'block px-4 py-2 text-sm text-gray-700 cursor-pointer'
                                    )}
                                  >
                                    Log out
                                  </a>
                                )}
                              </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </div>
                  <div className="-mr-2 flex md:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className={classNames(
                        item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                        'block px-3 py-2 rounded-md text-base font-medium'
                      )}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
                <div className="pt-4 pb-3 border-t border-gray-700">
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      <img className="h-10 w-10 rounded-full" src={user.imageUrl} alt="" />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">{user.name}</div>
                      <div className="text-sm font-medium leading-none text-gray-400">{user.email}</div>
                    </div>
                    <button
                      type="button"
                      className="ml-auto bg-gray-800 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    >
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    {userNavigation.map((item) => (
                      <Disclosure.Button
                        key={item.name}
                        as="a"
                        href={item.href}
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}
                      <Disclosure.Button
                        onClick={logout}
                        key="Log out"
                        as="a"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        Log out
                      </Disclosure.Button>
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-5 sm:px-6 flex justify-between">
              <div className="flex flex-col">
                <h3 className="text-lg max-w-max leading-6 font-medium text-gray-900">Stores</h3>
                <p className="mt-1 max-w-max text-sm text-gray-500">Current Stores</p>
              </div>
            </div>
            {/* Discounts Array */}
            { discountsArray }
            {/* /End Discounts Array */}
          </div>
        </main>
      </div> 
    </>
  )
}

export async function getServerSideProps(ctx) {
  const jwt = parseCookies(ctx).jwt
  // if there is a jwt token don’t authenticate the user again

  if (jwt) {

    return {
      props: {
        jwt: jwt,    
      }
    }
  }

 // if there isn’t a jwt token go home  

  return {
    redirect: {
      permanent: false,
      destination: `/`
    },
  };

}