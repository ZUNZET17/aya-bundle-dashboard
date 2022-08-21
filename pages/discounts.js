import { Disclosure, Menu, Transition, Dialog, Listbox } from '@headlessui/react'
import { BellIcon, MenuIcon, XIcon, TrashIcon } from '@heroicons/react/outline'
import { useRouter } from 'next/router';
import { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import nookies from 'nookies';
import { parseCookies, setCookie }  from 'nookies'
import { fetchDiscounts } from '../lib/utils'
import { shopifyGqlRequest, loadSearchResults } from '../lib/shopify'

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

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const strapi_url = process.env.NEXT_PUBLIC_STRAPI_URL

export default function Discounts({jwt}) {
  const router = useRouter();
  const [discount, setDiscount] = useState({
    data: {
      bundle:'',
      products: {
        selectedProducts: []
      },
      amount: 0,
      title: '',
      code: '',
      minimum: 0
    }  
  })
  const [discountsArr, setDiscountsArr] = useState([])
  const [searchProducts, setSearchProducts] = useState([])

  const logout = async () => {
    try {
      await axios.get('/api/logout');
      router.push('/');
    } catch (e) {
      console.log(e);
    }
  }

  const addDiscount = async () => {
    setSearchProducts([])
    axios({
      method: 'post',
      url: `${strapi_url}/api/discount-lists`,
      data: discount,
      headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
      },
    }).then(function (response) {
        console.log(response);
        setDiscount({ 
          data: { 
            bundle: '',
            products: {
              selectedProducts:[]
            },
            amount: 0,
            title: '',
            code: '',
            minimum: 0
          } 
        })
        loadDiscounts()
    }).catch(function (error) {
        console.log(error);
    });
  }

  const deleteDiscount = async (event, idx) => {
    const config = {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    }
    try {
      await axios.delete(`${strapi_url}/api/discount-lists/` + idx, config);
      loadDiscounts()
    } catch (err) {
      console.log(err.response.data);
    }
  
  }

  const loadDiscounts = async () => {
    const data = await fetchDiscounts(jwt);
    setDiscountsArr(data)
  }

  useEffect(() => {
    loadDiscounts()
  }, [])

  const queryProducts = async (qry, event) => {
    event.preventDefault()
    const data = await loadSearchResults(qry)
    data.products?.edges && setSearchProducts(data.products.edges
      .map(e => e.node)
    )
    event.target.parentElement.querySelector('ul').classList.remove('hidden')
  }

  const addSelectedVariant = (e) => {
    const updatedVariantsArr = discount.data.products.selectedProducts.concat(JSON.parse(e.currentTarget.getAttribute('data-variant')))
    setDiscount(
      { 
        data: { 
          bundle: discount.data.bundle, 
          products: {
            selectedProducts: updatedVariantsArr
          },
          amount: e.target.value,
          title: discount.data.title,
          code: discount.data.code,
          minimum: discount.data.minimum
        } 
      }
    )
  }

  const removeSelectedVariant = (e) => {
    const variantId = e.target.closest('li').getAttribute('data-id')
    const filteredArr = discount.data.products.selectedProducts.filter(v => {
      return v.id !== variantId
    })

    setDiscount(
      { 
        data: { 
          bundle: discount.data.bundle, 
          products: {
            selectedProducts: filteredArr
          },
          amount: e.target.value,
          title: discount.data.title,
          code: discount.data.code,
          minimum: discount.data.minimum
        } 
      }
    )

  }

  const discountsArray = discountsArr.map( (d, i) => {
    return (
      <div key={i} className="px-4 py-2 sm:px-0">
        <details className="border-t border-gray-200">
          <summary className="bg-slate-400 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 cursor-pointer hover:bg-slate-200">
            <dt className="text-sm font-medium text-black">{i + 1}</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0">{d.attributes.title}</dd>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0">{d.attributes.bundle}</dd>
          </summary>
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Products</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <ul role="list" className="divide-y divide-gray-200 mt-2 bg-white max-h-96 overflow-y-auto">
                  {
                  d.attributes.products && d.attributes.products?.selectedProducts.map((v, i) => {
                    return (
                    <li data-id={v.id} key={i} className="px-6 ">
                      <div className="flex py-3 items-center">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                          <img src={v.featuredImage.small} alt="Salmon orange fabric pouch with match zipper, gray zipper pull, and adjustable hip belt." className="h-full w-full object-cover object-center" />
                        </div>
                        <div className="ml-4 flex flex-1 flex-col justify-center">
                          <div>
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <h3>
                                <p>{v.title}</p>
                              </h3>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    )
                  })
                }
                </ul>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{d.attributes.amount}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Code</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{d.attributes.code}</dd>
            </div>
            <button onClick={ e => deleteDiscount(e, d.id)}>
              <TrashIcon className='block h-6 w-6 m-2'/>
            </button>
          </dl>
        </details>
      </div>
    )
  });

  const searchProductsResult = searchProducts ? searchProducts.map((p, i) => {
    return (
    <li data-id={p.id} data-variant={JSON.stringify(p)} onClick={e => addSelectedVariant(e)} key={i} className="cursor-pointer hover:bg-gray-200 px-4 ">
      <div className="flex py-3 items-center">
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
          <img src={p.featuredImage.small} alt="Salmon orange fabric pouch with match zipper, gray zipper pull, and adjustable hip belt." className="h-full w-full object-cover object-center" />
        </div>
        <div className="ml-4 flex flex-1 flex-col justify-center">
          <div>
            <div className="flex justify-between text-base font-medium text-gray-900">
              <h3>
                <p>{p.title}</p>
              </h3>
            </div>
          </div>
        </div>
      </div>
    </li>
    )
  }) :
  <p></p>

  const selectedVariantsArr = discount.data.products?.selectedProducts.map((v, i) => {
    return (
    <li data-id={v.id} key={i} className="px-6 ">
      <div className="flex py-3 items-center">
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
          <img src={v.featuredImage.small} alt="Salmon orange fabric pouch with match zipper, gray zipper pull, and adjustable hip belt." className="h-full w-full object-cover object-center" />
        </div>
        <div className="ml-4 flex flex-1 flex-col justify-center">
          <div>
            <div className="flex justify-between text-base font-medium text-gray-900">
              <h3>
                <p>{v.title}</p>
              </h3>
            </div>
          </div>
        </div>
        <div className="flex">
          <button onClick={e => removeSelectedVariant(e)} type="button" className="font-medium text-indigo-600 hover:text-indigo-500">Remove</button>
        </div>
      </div>
    </li>
    )
  })
  
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
                                      'block px-4 py-2 text-sm text-gray-700'
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
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Discounts</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Current Discounts</p>
            </div>
            {/* Discounts Array */}
            { discountsArray }
            {/* /End Discounts Array */}
            <DiscountModal 
            discount={discount} 
            setDiscount={setDiscount} 
            searchProductsResult={searchProductsResult}
            selectedVariantsArr={selectedVariantsArr}
            addDiscount={addDiscount}
            queryProducts={queryProducts}
            setSearchProducts={setSearchProducts}
             />
          </div>
        </main>
      </div> 
    </>
  )
}

export function DiscountModal(props) {
  let [isOpen, setIsOpen] = useState(false)
  const discount = props.discount
  const setDiscount = props.setDiscount
  const searchProductsResult = props.searchProductsResult
  const selectedVariantsArr = props.selectedVariantsArr
  const addDiscount = props.addDiscount
  const queryProducts = props.queryProducts
  const setSearchProducts = props.setSearchProducts

  function closeModal() {
    setIsOpen(false)
  }

  function openModal() {
    setIsOpen(true)
  }

  const addNewDiscount = () => {
    addDiscount()
    closeModal()
  }

  const closeSearchResults = (e) => {
    const modal = e.currentTarget
    const list = modal.querySelector('.js-searched-products-list')

    if (!list.contains(e.target)) {
      list.classList.add('hidden')
    }

  }

  return (
    <>
      <div className="inset-0 flex items-center justify-center">
        <button
          type="button"
          onClick={openModal}
          className="rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2"
        >
          Create New Discount Rule
        </button>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel onClick={e => closeSearchResults(e)} className="js-dialog-body w-full sm:max-w-xl lg:max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="add-discount-form p-4">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      Discount Details
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Enter Discount Values.
                      </p>
                    </div>
                    <div className="add-dicount-form__field flex flex-col mt-6">
                      <label htmlFor="discount-amount" className="add-discount__label">Discount Title</label>
                      <input onChange={e => setDiscount(
                        { 
                          data: { 
                            bundle: discount.data.bundle,
                            products: discount.data.products,
                            amount: discount.data.amount,
                            title: e.target.value,
                            code: discount.data.code,
                            minimum: discount.data.minimium
                          } 
                        }
                      )} id='discount-amount' type="text" value={discount.data.title} required/>
                    </div>
                    <div className="add-dicount-form__field flex flex-col">
                      <label htmlFor="discount-amount" className="add-discount__label">Bundle</label>
                      <input onChange={e => setDiscount(
                        { 
                          data: { 
                            bundle: e.target.value,
                            products: discount.data.products,
                            amount: discount.data.amount,
                            title: discount.data.title,
                            code: discount.data.code,
                            minimum: discount.data.minimum
                          } 
                        }
                      )} id='discount-amount' type="text" value={discount.data.bundle} required/>
                    </div>
                    <div className="add-dicount-form__field flex flex-col">
                      <div className="">
                        <form className='my-3'>   
                          <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-gray-300">Search</label>
                          <div className="relative">
                              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                                  <svg aria-hidden="true" className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                              </div>
                              <input type="search" id="default-search" className="block p-4 pl-10 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search products..." required />
                              <ul role="list" className="js-searched-products-list ease-out hidden shadow divide-y divide-gray-200 mt-2 absolute z-10 bg-white max-h-96 overflow-y-auto">
                                { searchProductsResult }
                              </ul>
                              <button onClick={e => queryProducts(e.target.parentElement.querySelector('input').value, e)} type="submit" className="text-white absolute right-2.5 bottom-2.5 bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Search</button>
                          </div>
                        </form>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Selected Variants</h3>
                      </div>
                      <ul role="list" className="divide-y divide-gray-200 mt-2 bg-slate-300 max-h-96 overflow-y-auto">
                        { selectedVariantsArr }
                      </ul>
                    </div>
                    <div className="add-dicount-form__field flex flex-col">
                      <label htmlFor="discount-amount" className="add-discount__label">Discount amount in %</label>
                      <input onChange={e => setDiscount(
                        { 
                          data: {
                            bundle: discount.data.bundle,
                            products: discount.data.products,
                            amount: e.target.value,
                            title: discount.data.title,
                            code: discount.data.code,
                            minimum: discount.data.minimum
                          } 
                        }
                      )} id='discount-amount' type="text" value={discount.data.amount} required/>
                    </div>
                    <div className="add-dicount-form__field flex flex-col">
                      <label htmlFor="discount-amount" className="add-discount__label">Minimum Quantity</label>
                      <input onChange={e => setDiscount(
                        { 
                          data: {
                            bundle: discount.data.bundle,
                            products: discount.data.products,
                            amount: discount.data.amount,
                            title: discount.data.title,
                            code: discount.data.code,
                            minimum: e.target.value
                          } 
                        }
                      )} id='discount-amount' type="text" value={discount.data.minimum} required/>
                    </div>
                    <div className="add-dicount-form__field flex flex-col">
                      <label htmlFor="discount-amount" className="add-discount__label">Discount Code</label>
                      <input onChange={e => setDiscount(
                        { 
                          data: {
                            bundle: discount.data.bundle,
                            products: discount.data.products,
                            amount: discount.data.amount,
                            title: discount.data.title,
                            code: e.target.value,
                            minimum: discount.data.minimum
                          } 
                        }
                      )} id='discount-amount' type="text" value={discount.data.code} required/>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={addNewDiscount}
                    >
                      Add Discount
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
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