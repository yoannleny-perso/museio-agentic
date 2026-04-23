import { type FormEvent, type ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Download } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const NAV_ITEMS = [
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Pricing', href: '#pricing' },
];

const LOGO_WORDMARKS = [
  {
    label: 'eBay',
    className: 'w-[5rem] lg:w-[5.5rem]',
    render: () => (
      <img
        src="/landing/Other/logos-landing/ebay.svg"
        alt="eBay"
        className="w-[3.75rem] object-contain lg:w-[4.05rem]"
      />
    ),
  },
  {
    label: 'Vimeo',
    className: 'w-[5rem] lg:w-[5.5rem]',
    render: () => (
      <span className="flex h-full w-full items-center justify-center">
        <img
          src="/landing/Other/logos-landing/vimeo.svg"
          alt="Vimeo"
          className="w-[3.45rem] object-contain lg:w-[3.75rem]"
        />
      </span>
    ),
  },
  {
    label: 'Zapier',
    className: 'w-[5rem] lg:w-[5.5rem]',
    render: () => (
      <img
        src="/landing/Other/logos-landing/zapier.svg"
        alt="Zapier"
        className="w-[3.95rem] object-contain lg:w-[4.25rem]"
      />
    ),
  },
  {
    label: 'Shopify',
    className: 'w-[5rem] lg:w-[5.5rem]',
    render: () => (
      <img
        src="/landing/Other/logos-landing/shopify.svg"
        alt="Shopify"
        className="w-[4rem] object-contain lg:w-[4.3rem]"
      />
    ),
  },
  {
    label: 'SoundCloud',
    className: 'w-[5rem] lg:w-[5.5rem]',
    render: () => (
      <img
        src="/landing/Other/logos-landing/soundcloud.svg"
        alt="SoundCloud"
        className="w-[4.85rem] object-contain lg:w-[5.2rem]"
      />
    ),
  },
];

const BUSINESS_FEATURES = [
  { label: 'Manage all your bookings', icon: '/landing/Other/small_purple_icons/Group 43.svg' },
  { label: 'Create your presskit', icon: '/landing/Other/small_purple_icons/Group 46.svg' },
  { label: 'Track your finances', icon: '/landing/Other/small_purple_icons/Group 41.svg' },
  { label: 'Grow your audience', icon: '/landing/Other/small_purple_icons/Group 42.svg' },
];

const ADMIN_FEATURES = [
  { label: 'Make money from your passion', icon: '/landing/Other/small_purple_icons/Group 45.svg' },
  { label: 'Less admin, more gigs', icon: '/landing/Other/small_purple_icons/Group 46.svg' },
  { label: 'Boost your reach', icon: '/landing/Other/small_purple_icons/Group 47.svg' },
  { label: 'Focus on what you love', icon: '/landing/Other/small_purple_icons/Group 48.svg' },
];

const PLATFORM_CARDS = [
  {
    title: 'PORTFOLIO',
    image: '/landing/Other/one_platform/portfolio.svg',
  },
  {
    title: 'SMART CALENDAR',
    image: '/landing/Other/one_platform/calendar.svg',
  },
  {
    title: 'DIRECT INVOICING',
    image: '/landing/Other/one_platform/invoicing.svg',
  },
  {
    title: 'FINANCE TRACKING',
    image: '/landing/Other/one_platform/finance.svg',
  },
  {
    title: 'SEAMLESS BOOKING',
    image: '/landing/Other/one_platform/booking.svg',
  },
];

const ARTIST_CARDS = [
  { name: 'Azzure', image: '/landing/Other/artists/Azxure.svg' },
  { name: 'Dr Mendez', image: '/landing/Other/artists/Mendez.svg' },
  { name: 'Lexa', image: '/landing/Other/artists/Lexa.svg' },
  { name: 'Quentin LNV', image: '/landing/Other/artists/Quentin.svg' },
];

const TESTIMONIALS = [
  '/landing/Other/love_museio/love-museio1.svg',
  '/landing/Other/love_museio/love-museio2.svg',
  '/landing/Other/love_museio/love-museio3.svg',
  '/landing/Other/love_museio/love-museio4.svg',
];

const COMMUNITY_UPDATES = '/landing/Other/dj_updates.svg';

const FAQ_ITEMS = [
  {
    value: 'what-is-museio',
    question: 'What is Museio?',
    answer:
      'Museio is an all-in-one admin platform for DJs and artists to manage bookings, invoicing, finances, and their public-facing portfolio.',
  },
  {
    value: 'who-is-it-for',
    question: 'Who is Museio for?',
    answer:
      'It is designed for DJs, performers, and creative professionals who want a cleaner system for handling clients, gigs, and growth.',
  },
  {
    value: 'how-bookings-work',
    question: 'How can Museio help me having more bookings?',
    answer:
      'Your public profile, booking workflow, and admin tools work together so it is easier for clients to discover you and submit serious enquiries.',
  },
  {
    value: 'invoicing',
    question: 'How does invoicing and finance work in Museio?',
    answer:
      'Museio helps you create projects, issue invoices, track payment status, and keep your income view organized in one place.',
  },
  {
    value: 'payment-fees',
    question: 'What is the formula of answering to WISE for card payment?',
    answer:
      'Payment-processing configuration depends on the provider you connect. Museio surfaces the workflow inside the app once your payment setup is enabled.',
  },
  {
    value: 'trial',
    question: 'How my Museio Portfolio can help me?',
    answer:
      'Your portfolio gives you a polished public page where you can present your brand, share social proof, and collect booking requests.',
  },
  {
    value: 'behind-museio',
    question: 'Who is behind Museio?',
    answer:
      'Museio is built for working DJs and artists who need practical systems, not bloated business software.',
  },
];

type ContactFormState = {
  name: string;
  email: string;
  message: string;
};

type FeatureRowProps = {
  title: string;
  items: Array<{ label: string; icon: string }>;
  image: string;
  imageAlt: string;
  reverse?: boolean;
};

const FeatureList = ({ items }: { items: Array<{ label: string; icon: string }> }) => (
  <ul className="space-y-[1.15rem] text-[22px] font-normal leading-[1] tracking-[0em] text-[#17111F]">
    {items.map((item) => (
      <li key={item.label} className="flex items-center gap-4">
        <img src={item.icon} alt="" aria-hidden="true" className="h-[2.2rem] w-[2.2rem] shrink-0" />
        <span>{item.label}</span>
      </li>
    ))}
  </ul>
);

const FeatureRow = ({ title, items, image, imageAlt, reverse = false }: FeatureRowProps) => (
  <div
    className={`grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] ${
      reverse ? 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1' : ''
    }`}
  >
    <div className="space-y-8">
      <h3 className="max-w-[10.5ch] text-[42px] font-bold uppercase leading-[1] tracking-[0em] text-[#8A71CF]">
        {title}
      </h3>
      <FeatureList items={items} />
      <Button
        onClick={() => {
          window.location.assign('/auth');
        }}
        className="h-[3.1rem] rounded-full bg-[#4F2293] px-[1.9rem] text-[20px] font-semibold tracking-[0em] shadow-[0_14px_26px_-16px_rgba(79,34,147,0.9)] hover:bg-[#4F2293]"
      >
        Start now
      </Button>
    </div>

    <div className="mx-auto w-full max-w-[32rem]">
      <img src={image} alt={imageAlt} className="w-full" />
    </div>
  </div>
);

const FooterLinkGroup = ({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) => (
  <div className="space-y-3 text-center sm:text-left">
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A71CF]">{title}</p>
    <div className="space-y-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className="block text-xs font-medium text-[#685B84] transition-colors hover:text-[#5F1FB8]"
        >
          {link.label}
        </a>
      ))}
    </div>
  </div>
);

const Landing = () => {
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState<ContactFormState>({
    name: '',
    email: '',
    message: '',
  });

  const handleAuthNavigation = () => {
    navigate('/auth');
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setContactForm((current) => ({ ...current, [name]: value }));
  };

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams({
      subject: `Museio landing enquiry from ${contactForm.name || 'website visitor'}`,
      body: `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`,
    });

    window.location.href = `mailto:support@museioapp.com?${params.toString()}`;
  };

  return (
    <div className="font-landing-outfit overflow-x-hidden bg-white text-[#241B37]">
      <section
        id="about"
        className="relative overflow-hidden bg-[linear-gradient(180deg,#9D88E8_0%,#C6B8F4_40%,#FFFFFF_100%)]"
      >
        <div className="mx-auto max-w-[1240px] px-2 pb-16 pt-3 sm:px-4 sm:pb-20 sm:pt-4 lg:px-2 lg:pb-24">
          <header className="rounded-full bg-white px-6 py-[0.65rem] shadow-[0_14px_40px_-24px_rgba(56,29,117,0.42)] sm:px-7 lg:px-6">
            <div className="grid items-center gap-4 md:grid-cols-[auto_1fr_auto]">
              <a href="#about" className="shrink-0">
                <img
                  src="/landing/Other/Logos-Museio/LOGO-PURPLE.png"
                  alt="Museio"
                  className="h-[1.5rem] w-auto sm:h-[1.65rem]"
                />
              </a>

              <nav className="hidden items-center justify-self-center gap-10 text-[18px] font-light leading-none tracking-[0em] text-[#56487B] md:flex md:translate-x-8 lg:gap-11 lg:translate-x-10">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="transition-colors hover:text-[#4F2293]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <Button
                onClick={handleAuthNavigation}
                className="hidden h-[2.35rem] rounded-full bg-[#4F2293] px-[1.55rem] text-[0.98rem] font-semibold tracking-[-0.02em] text-white shadow-none hover:bg-[#4F2293] sm:inline-flex lg:h-[2.45rem] lg:px-[1.7rem]"
              >
                Sign up
              </Button>
            </div>
          </header>

          <div className="grid items-center gap-12 pb-10 pt-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:pb-14 lg:pt-16">
            <div className="min-w-0 w-full max-w-none lg:max-w-[31rem]">
              <h1 className="max-w-[7ch] text-[2.8rem] font-bold uppercase leading-[1] tracking-[0em] text-white sm:max-w-none sm:text-[3.2rem] lg:text-[41.48px]">
                Your creative career organized in one smart platform
              </h1>
              <p className="mt-5 max-w-[22rem] text-[22px] font-normal leading-[1] tracking-[0em] text-white/90 sm:max-w-md">
                Manage bookings, avoid invoice chaos, track your finances, and keep your public
                presence polished. All in one place.
              </p>
              <Button
                onClick={handleAuthNavigation}
                className="mt-8 h-10 rounded-full bg-[#4F2293] px-6 text-sm font-semibold shadow-[0_18px_30px_-18px_rgba(59,25,131,0.9)] hover:bg-[#4F2293]"
              >
                Get started
              </Button>
            </div>

            <div className="relative mx-auto w-full max-w-[29rem] sm:max-w-[31rem] lg:max-w-[34rem]">
              <div className="relative aspect-[595/572] w-full overflow-visible">
                <img
                  src="/landing/Other/Ellipse 1.svg"
                  alt=""
                  aria-hidden="true"
                  className="absolute bottom-[0.5%] left-[6%] z-0 w-[88%] max-w-none"
                />
                <img
                  src="/landing/Other/FINAL MOCKUP 1.svg"
                  alt="Museio mobile app preview"
                  className="absolute left-1/2 top-1/2 z-10 w-[107.25%] max-w-none -translate-x-1/2 -translate-y-[44%] drop-shadow-[0_24px_42px_rgba(70,33,131,0.18)]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-t-[2rem] bg-white pt-6 sm:rounded-t-[2.5rem] sm:pt-7">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 items-center justify-items-center gap-x-6 gap-y-5 border-b border-[#EEE7FF] pb-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6 lg:pb-7">
              {LOGO_WORDMARKS.map((item) => (
                <div
                  key={item.label}
                  aria-label={item.label}
                  className={`flex h-10 w-full items-center justify-center text-black lg:h-10 ${item.className}`}
                >
                  {item.render()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white">
        <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-8 lg:py-[4.6rem]">
          <div className="mx-auto max-w-[66rem] text-center">
            <h2 className="text-center text-[42px] font-bold uppercase leading-[1] tracking-[0em] text-[#221739]">
              Everything you need to succeed.
            </h2>
            <p className="mt-2 text-center text-[42px] font-bold uppercase leading-[1] tracking-[0em] text-[#8A71CF]">
              In one platform.
            </p>
            <p className="mx-auto mt-[2.15rem] max-w-[43rem] text-center text-[22px] font-normal leading-[1.35] tracking-[0em] text-[#17111F]">
              Do you struggle following-up your bookings, creating your invoices, and presenting
              yourself professionally? Museio brings all together: bookings and client management,
              invoicing, payments, and a tailored portfolio.
            </p>
          </div>

          <div className="mt-[6.8rem] space-y-[6.8rem]">
            <FeatureRow
              title="Where artists grow their business"
              items={BUSINESS_FEATURES}
              image="/landing/Other/feature-growth-collage.svg"
              imageAlt="Business growth collage"
            />
            <FeatureRow
              title="Smart admin for busy artists"
              items={ADMIN_FEATURES}
              image="/landing/Other/feature-admin-collage.svg"
              imageAlt="Smart admin collage"
              reverse
            />
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#A991F0_0%,#B9A6F3_46%,#CBBBF8_100%)] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-center text-[42px] font-bold uppercase leading-[1] tracking-[0em]">
              One platform
              <br />
              all the features
            </h2>
            <p className="mt-2 text-sm font-medium text-white/80 sm:text-base">
              Save time. Make money.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {PLATFORM_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="w-[12.5rem] shrink-0 rounded-[1.15rem] bg-white/18 p-2 backdrop-blur"
                >
                  <div className="overflow-hidden rounded-[0.95rem] bg-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]">
                    <img src={card.image} alt={card.title} className="w-full" />
                  </div>
                  <p className="px-2 pb-2 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/92">
                    {card.title}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <a href="#available">
              <Button className="h-10 rounded-full bg-[#4F2293] px-7 text-sm font-semibold hover:bg-[#4F2293]">
                Download now
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="overflow-x-auto pb-3">
            <div className="flex min-w-max justify-center gap-5">
              {ARTIST_CARDS.map((artist) => (
                <article
                  key={artist.name}
                  className="w-[14.8rem] shrink-0 overflow-hidden rounded-[1.05rem] shadow-[0_20px_32px_-28px_rgba(35,20,73,0.6)]"
                >
                  <img src={artist.image} alt={artist.name} className="w-full" />
                </article>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-1.5">
            {[0, 1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={`h-1.5 w-1.5 rounded-full ${dot === 1 ? 'bg-[#8D63FF]' : 'bg-[#D6CCF7]'}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="available" className="bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
            <div>
              <h2 className="text-[42px] font-bold uppercase leading-[1] tracking-[0em] text-[#8A71CF]">
                Now available on
              </h2>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="https://play.google.com/store/apps/details?id=audaciangroup.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/GetItOnGooglePlay_Badge_Web_color_English.png"
                    alt="Get it on Google Play"
                    className="h-12 w-auto"
                  />
                </a>
                <a
                  href="https://apps.apple.com/au/app/museio/id6747413453"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg"
                    alt="Download on the App Store"
                    className="h-12 w-auto"
                  />
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[42rem]">
              <img
                src="/landing/Other/iPhone_15_Mockup_Poster.svg"
                alt="Museio phone mockup"
                className="w-full scale-[1.08] sm:scale-[1.03]"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="reviews"
        className="bg-[linear-gradient(180deg,#A58FEB_0%,#A08AE7_100%)] py-16 text-white sm:py-20"
      >
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-[42px] font-bold uppercase leading-[1] tracking-[0em]">
            Why they love Museio
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {TESTIMONIALS.map((image, index) => (
              <article key={index} className="overflow-hidden rounded-[1rem]">
                <img src={image} alt={`Museio testimonial ${index + 1}`} className="w-full" />
              </article>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={handleAuthNavigation}
              className="h-10 rounded-full bg-[#4F2293] px-7 text-sm font-semibold hover:bg-[#4F2293]"
            >
              Join Museio
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.95fr)]">
            <div className="max-w-md">
              <h2 className="text-[42px] font-bold uppercase leading-[1] tracking-[0em] text-[#8A71CF]">
                Created by DJs
                <br />
                for DJs
              </h2>
              <p className="mt-5 text-sm leading-6 text-[#5E5376] sm:text-base">
                A step by step guide to start your DJ career. Find out where to begin and how to
                achieve success.
              </p>
              <a href="/How%20to%20start%20your%20DJ%20Business%20eBook2026.pdf" target="_blank" rel="noopener noreferrer">
                <Button className="mt-7 h-10 rounded-full bg-[#4F2293] px-6 text-sm font-semibold hover:bg-[#4F2293]">
                  <Download className="h-4 w-4" />
                  Download the eBook
                </Button>
              </a>
            </div>

            <div className="mx-auto w-full max-w-[22rem]">
              <img
                src="/landing/Other/ebook.svg"
                alt="eBook cover"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pb-16 sm:pb-20">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-[42px] font-bold uppercase leading-[1] tracking-[0em] text-[#8A71CF]">
            Community & updates
          </h2>
          <div className="mt-8 flex justify-center">
            <article className="overflow-hidden rounded-[1.05rem]">
              <img src={COMMUNITY_UPDATES} alt="Community and updates" className="w-full max-w-[73rem]" />
            </article>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white pb-16 sm:pb-20">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[1.45rem] bg-white shadow-[0_30px_60px_-44px_rgba(47,25,93,0.55)] ring-1 ring-[#EEE7FF]">
            <div className="grid items-stretch lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
              <div className="flex items-center px-8 py-10 sm:px-10 lg:px-12">
                <div className="max-w-sm">
                  <h2 className="text-[42px] font-bold uppercase leading-[1] tracking-[0em] text-[#8A71CF]">
                    No upfront cost
                  </h2>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.1em] text-[#7B6E97]">
                    Free to start.
                  </p>
                  <p className="mt-4 text-sm leading-6 text-[#5F5377] sm:text-base">
                    Create your project. Get booked. View your income graph, grow with us.
                  </p>
                  <Button
                    onClick={handleAuthNavigation}
                    className="mt-7 h-10 rounded-full bg-[#4F2293] px-6 text-sm font-semibold hover:bg-[#4F2293]"
                  >
                    Start now
                  </Button>
                  <a
                    href="#pricing"
                    className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#7C61E0] transition-colors hover:text-[#5F1FB8]"
                  >
                    Pricing page
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="bg-[linear-gradient(135deg,#8F6CE5_0%,#C763CF_100%)]">
                <img
                  src="/landing/Other/no_upfront_cost.svg"
                  alt="No upfront cost"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[linear-gradient(180deg,#FFFFFF_0%,#CDBBF9_100%)] pt-8">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-t-[2rem] bg-white px-6 py-12 sm:px-8 lg:px-12 lg:py-14">
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="max-w-md">
                <h2 className="text-[42px] font-bold uppercase leading-[1] tracking-[0em] text-[#8A71CF]">
                  Get in touch
                </h2>
                <p className="mt-5 text-sm font-bold uppercase leading-5 tracking-[0.08em] text-[#7E6AA8]">
                  If you have any questions not answered here, please get in touch via this form or
                  by emailing support@museioapp.com.
                </p>
                <div className="mt-12 h-6 w-24 rounded-b-full bg-[#8A71CF]" />
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] text-[#8A71CF]">
                  Contact us
                </h3>
                <div className="space-y-3">
                  <Input
                    name="name"
                    value={contactForm.name}
                    onChange={handleInputChange}
                    placeholder="Name"
                    required
                    className="h-10 rounded-full border-[#DDD2FD] px-4"
                  />
                  <Input
                    name="email"
                    type="email"
                    value={contactForm.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    required
                    className="h-10 rounded-full border-[#DDD2FD] px-4"
                  />
                  <Textarea
                    name="message"
                    value={contactForm.message}
                    onChange={handleInputChange}
                    placeholder="Message"
                    required
                    className="min-h-[112px] rounded-[1rem] border-[#DDD2FD] px-4 py-3"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-10 rounded-full bg-[#4F2293] px-7 text-sm font-semibold hover:bg-[#4F2293]"
                >
                  Submit
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-16 text-white sm:py-20"
        style={{
          background: [
            'radial-gradient(circle at 18% 82%, rgba(128, 86, 220, 0.95) 0%, rgba(128, 86, 220, 0) 34%)',
            'radial-gradient(circle at 50% 54%, rgba(171, 141, 244, 0.78) 0%, rgba(171, 141, 244, 0) 22%)',
            'radial-gradient(circle at 84% 18%, rgba(119, 83, 214, 0.8) 0%, rgba(119, 83, 214, 0) 30%)',
            'linear-gradient(180deg, #a68cf1 0%, #c9b8f8 100%)',
          ].join(', '),
        }}
      >
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-[42px] font-bold uppercase leading-[1] tracking-[0em]">
            FAQ
          </h2>
          <div className="mx-auto mt-8 max-w-[51.2rem] rounded-[1.5rem] p-2 sm:p-4">
            <Accordion type="single" collapsible className="space-y-[1.55rem]">
              {FAQ_ITEMS.map((item) => (
                <AccordionItem
                  key={item.value}
                  value={item.value}
                  className="overflow-hidden rounded-[1rem] border-[2px] border-white bg-white/[0.03] px-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] backdrop-blur-[2px] sm:px-5"
                >
                  <AccordionTrigger
                    iconSrc="/landing/Other/button_faq.svg"
                    iconAlt=""
                    iconClassName="h-[45px] w-[30px]"
                    className="py-[12px] text-left text-[18px] font-medium tracking-[0em] text-white hover:no-underline sm:py-[14px] sm:text-[21px]"
                  >
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pr-10 text-[15px] leading-6 text-white/88 sm:text-base">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <footer className="bg-white py-10">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-6 text-center sm:text-left">
              <img
                src="/landing/Other/Logos-Museio/LOGO-PURPLE.png"
                alt="Museio"
                className="mx-auto h-9 w-auto sm:mx-0"
              />
              <div className="text-[10px] font-medium text-[#7F739A]">
                <a href="/terms-and-privacy" className="transition-colors hover:text-[#5F1FB8]">
                  Terms and Conditions
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <FooterLinkGroup
                title="About"
                links={[
                  { label: 'Features', href: '#features' },
                  { label: 'Download', href: '#available' },
                ]}
              />
              <FooterLinkGroup
                title="eBook"
                links={[
                  {
                    label: 'Testimonials',
                    href: '#reviews',
                  },
                  { label: 'Pricing', href: '#pricing' },
                ]}
              />
              <FooterLinkGroup
                title="Contacts"
                links={[
                  { label: 'FAQ', href: '#contact' },
                  { label: 'Support', href: 'mailto:support@museioapp.com' },
                ]}
              />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-[#EEE7FF] pt-5 text-center text-[10px] font-medium text-[#7F739A] sm:flex-row sm:items-center sm:justify-between">
            <span>© Museio 2026. All rights reserved.</span>
            <span>ABN 60000000000</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
