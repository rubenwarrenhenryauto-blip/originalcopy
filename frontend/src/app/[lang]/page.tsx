import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getDictionary } from '@/lib/dictionaries';
import { getLandingContent, type Testimonial } from '@/lib/hygraph';
import { createServiceClient } from '@/lib/supabase/server';
import { i18n } from '@/i18n-config';
import ZipChecker from '@/components/ZipChecker/ZipChecker';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

// ─── Fallback testimonials (used until HyGraph has data) ──────────────────────
const FALLBACK_TESTIMONIALS: Testimonial[] = [
    {
        authorName: 'Marcus T.',
        location: 'Miami, FL',
        rating: 5,
        text: "My car hasn't looked this good since I drove it off the lot. The DTailWash team did an incredible job on the full detail.",
        vehicleType: '2022 BMW M3',
    },
    {
        authorName: 'Sofia R.',
        location: 'Coral Gables, FL',
        rating: 5,
        text: 'Booked online in 2 minutes, they showed up on time, and my SUV looks brand new. Absolutely worth every penny.',
        vehicleType: '2023 Range Rover Sport',
    },
    {
        authorName: 'James K.',
        location: 'Brickell, FL',
        rating: 5,
        text: 'The engine bay cleaning alone was worth it. These guys are true professionals. Booking monthly from now on.',
        vehicleType: '2021 Porsche 911 Carrera',
    },
];

export default async function LandingPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const locale = i18n.locales.includes(lang as 'en' | 'es') ? (lang as 'en' | 'es') : 'en';

    // No auto-redirect — authenticated users can still view the landing page

    const [dict, hygraph] = await Promise.all([
        getDictionary(locale),
        getLandingContent(locale),
    ]);

    // Merge HyGraph content with dictionary fallbacks
    const hero = {
        heading: hygraph.hero?.heading ?? dict.home.hero.title,
        subheading: hygraph.hero?.subheading ?? dict.home.hero.subtitle,
        badgeText: locale === 'es' ? 'Ahora disponible en Miami' : 'Now available in Miami',
    };

    const testimonials = hygraph.testimonials.length ? hygraph.testimonials : FALLBACK_TESTIMONIALS;
    const heroImage = hygraph.hero?.heroImageUrl ?? null;
    const allGalleryImages = hygraph.galleryImages ?? [];
    const workImages = allGalleryImages.filter((img) => img.section === 'home-hero' || img.section === 'home-gallery');
    const serviceImages = allGalleryImages.filter((img) => img.section === 'home-services').sort((a,b) => a.sortOrder - b.sortOrder);
    const stepImages = allGalleryImages.filter((img) => img.section === 'how-it-works').sort((a,b) => a.sortOrder - b.sortOrder);

    // ── Services: live from Supabase so admin edits reflect here immediately ──
    let dbServices: { id: number; name: string; name_es: string | null; description: string | null; description_es: string | null; base_price: number; sort_order: number | null }[] = [];
    try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('services')
            .select('id, name, name_es, description, description_es, base_price, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(6);
        if (error) console.error('[LandingPage] services query error:', error.message);
        dbServices = data ?? [];
    } catch (e) { console.error('[LandingPage] services fetch failed:', e); }

    const SERVICE_ICONS: Record<string, string> = {
        express: '⚡', interior: '🪡', exterior: '✨', full: '🏆',
        'Express Detail': '⚡', 'Interior Detail': '🪡',
        'Exterior Detail': '✨', 'Full Detail': '🏆',
        'Detalle Expres': '⚡', 'Detalle Interior': '🪡',
        'Detalle Exterior': '✨', 'Detalle Completo': '🏆',
    };

    const services = dbServices.length > 0
        ? dbServices.map((s, i) => ({
            title: locale === 'es' ? (s.name_es ?? s.name) : s.name,
            desc: locale === 'es' ? (s.description_es ?? s.description ?? '') : (s.description ?? ''),
            price: `From $${Math.round(s.base_price)}`,
            icon: SERVICE_ICONS[s.name] ?? SERVICE_ICONS[Object.keys(SERVICE_ICONS).find(k => s.name.toLowerCase().includes(k.toLowerCase())) ?? ''] ?? ['\u26a1','\ud83e\udea1','\u2728','\ud83c\udfc6'][i] ?? '\u2728',
            image: serviceImages[i]?.imageUrl,
          }))
        : [
            { ...dict.home.services.express, icon: '\u26a1', image: serviceImages[0]?.imageUrl },
            { ...dict.home.services.interior, icon: '\ud83e\udea1', image: serviceImages[1]?.imageUrl },
            { ...dict.home.services.exterior, icon: '\u2728', image: serviceImages[2]?.imageUrl },
            { ...dict.home.services.full, icon: '\ud83c\udfc6', image: undefined },
          ];

    const steps = [
        { number: '01', ...dict.home.howItWorks.step1, icon: '📍', image: stepImages[0]?.imageUrl },
        { number: '02', ...dict.home.howItWorks.step2, icon: '🚐', image: stepImages[1]?.imageUrl },
        { number: '03', ...dict.home.howItWorks.step3, icon: '☕', image: stepImages[2]?.imageUrl },
    ];

    return (
        <div className="min-h-screen bg-[#131835] text-white overflow-x-hidden">
            {/* ─── Hero ──────────────────────────────────────────────────────── */}
            <section className="relative min-h-screen flex flex-col items-center px-6 pt-32 pb-12 overflow-hidden">
                {/* Hero background image from Hygraph */}
                {heroImage && (
                    <Image
                        src={heroImage}
                        alt="Auto detail hero"
                        fill
                        priority
                        className="object-cover object-center opacity-20"
                        sizes="100vw"
                    />
                )}
                {/* Gold radial glow */}
                <div
                    className="absolute inset-0 pointer-events-none z-[1]"
                    style={{
                        background:
                            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(208, 176, 120, 0.18) 0%, transparent 70%)',
                    }}
                />
                {/* Subtle grid */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03] z-[1]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                />

                {/* Promotional Banner */}
                {hygraph.promotionalBanner?.isActive && (
                    <div className="absolute top-0 left-0 right-0 z-50 text-[#131835] py-2.5 px-6 text-center shadow-lg font-medium text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 overflow-hidden"
                         style={{ background: 'linear-gradient(90deg, #c4a068 0%, #E6C88D 50%, #c4a068 100%)', backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }}>
                        <style>{`
                            @keyframes shimmer {
                                0% { background-position: 0% center; }
                                100% { background-position: 200% center; }
                            }
                        `}</style>
                        <span>{hygraph.promotionalBanner.message}</span>
                    </div>
                )}

                {/* Nav bar */}
                <div className={`absolute left-0 right-0 z-20 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full transition-all ${hygraph.promotionalBanner?.isActive ? 'top-10 sm:top-[44px]' : 'top-0'}`}>
                    <Image src="/dtailwash_logo_final.png" alt={dict.common.siteName} width={486} height={130} className="w-auto h-20 sm:h-32 opacity-100 drop-shadow-md" />
                    <Link
                        href={`/${locale}/login`}
                        className="text-xs font-medium text-[#D0B078] border border-[#D0B078]/30 rounded-full px-4 py-1.5 hover:bg-[#D0B078]/10 transition-colors"
                    >
                        {locale === 'es' ? 'Iniciar sesión' : 'Log in'}
                    </Link>
                </div>

                <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto text-center space-y-8 py-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D0B078]/30 bg-[#D0B078]/5 text-[#D0B078] text-xs font-medium tracking-widest uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D0B078] animate-pulse" />
                        {hero.badgeText}
                    </div>

                    {/* Heading */}
                    <h1
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        {hero.heading.split(' ').map((word, i, arr) =>
                            i >= arr.length - 2 ? (
                                <span key={i} className="text-gold-gradient">{word}{i < arr.length - 1 ? ' ' : ''}</span>
                            ) : (
                                <span key={i}>{word} </span>
                            )
                        )}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg text-white/75 font-light max-w-md mx-auto leading-relaxed">
                        {hero.subheading}
                    </p>

                    {/* ZIP Checker */}
                    <div className="w-full max-w-lg mx-auto">
                        <ZipChecker dict={dict.zipChecker} lang={locale} />
                    </div>

                    {/* Auth links */}
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <span className="text-white/60 text-sm">{locale === 'es' ? '¿Ya tienes cuenta?' : 'Already a member?'}</span>
                        <Link
                            href={`/${locale}/login`}
                            className="text-sm text-white/60 hover:text-white transition-colors underline underline-offset-4"
                        >
                            {locale === 'es' ? 'Iniciar sesión' : 'Log in'}
                        </Link>
                    </div>
                </div>

                {/* Scroll indicator - Better positioning to avoid overlap on small screens */}
                <div className="relative z-10 mt-auto hidden sm:flex flex-col items-center gap-2 opacity-30 pb-4">
                    <span className="text-xs tracking-widest uppercase">{locale === 'es' ? 'Desplázate' : 'Scroll'}</span>
                    <div className="w-px h-8 bg-white/40 animate-pulse" />
                </div>
            </section>

            {/* ─── Stats ─────────────────────────────────────────────────────── */}
            <section className="border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    {[
                        { value: '2,400+', label: locale === 'es' ? 'Detalles completados' : 'Details completed' },
                        { value: '4.97', label: locale === 'es' ? 'Calificación promedio' : 'Average rating' },
                        { value: '1', label: locale === 'es' ? 'Ciudad servida' : 'City served' },
                    ].map((stat) => (
                        <div key={stat.label} className="space-y-1">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gold-gradient">{stat.value}</div>
                            <div className="text-xs text-white/55 tracking-wide">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── How It Works ───────────────────────────────────────────────── */}
            <section className="py-14 sm:py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10 sm:mb-16 space-y-3">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                            {locale === 'es' ? 'El proceso' : 'The process'}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            {dict.home.howItWorks.title}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {steps.map((step) => (
                            <div
                                key={step.number}
                                className="glass-card rounded-2xl overflow-hidden group hover:border-[#D0B078]/20 transition-colors flex flex-col"
                            >
                                {step.image && (
                                    <div className="relative h-48 w-full shrink-0">
                                        <Image src={step.image} alt={step.title} fill className="object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#131835] via-[#131835]/40 to-transparent opacity-90" />
                                    </div>
                                )}
                                <div className={`p-8 space-y-4 flex-1 ${step.image ? '-mt-10 relative z-10' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-4xl drop-shadow-lg">{step.icon}</span>
                                        <span className="text-5xl font-bold text-white/5 group-hover:text-[#D0B078]/10 transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                                            {step.number}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-white/70 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Services ───────────────────────────────────────────────────── */}
            <section className="py-14 sm:py-24 px-6 bg-white/[0.015]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10 sm:mb-16 space-y-3">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                            {locale === 'es' ? 'Nuestros servicios' : 'Our services'}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            {dict.home.services.title}
                        </h2>
                        <p className="text-white/60 text-sm">{dict.home.services.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {services.map((service, i) => (
                            <div
                                key={service.title}
                                className={`glass-card rounded-2xl flex flex-col overflow-hidden ${
                                    i === 3 ? 'ring-1 ring-[#D0B078]/30 shadow-[0_0_30px_rgba(208,176,120,0.1)]' : ''
                                }`}
                            >
                                {service.image && (
                                    <div className="relative h-44 w-full shrink-0">
                                        <Image src={service.image} alt={service.title} fill className="object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#131835] via-[#131835]/40 to-transparent opacity-90" />
                                        <div className="absolute bottom-4 left-5 text-3xl drop-shadow-xl z-10">{service.icon}</div>
                                    </div>
                                )}
                                <div className={`p-6 space-y-4 flex-1 flex flex-col ${service.image ? 'pt-5 relative z-10' : ''}`}>
                                    {!service.image && (
                                        <>
                                            {i === 3 && (
                                                <div className="inline-flex self-start px-2.5 py-0.5 rounded-full bg-[#D0B078]/10 text-[#D0B078] text-xs font-semibold tracking-wide">
                                                    {locale === 'es' ? 'Más popular' : 'Most popular'}
                                                </div>
                                            )}
                                            <span className="text-3xl">{service.icon}</span>
                                        </>
                                    )}
                                    <div className="space-y-1.5 flex-1">
                                        <h3 className="text-base font-semibold leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
                                            {service.title}
                                        </h3>
                                        <p className="text-white/75 text-base leading-relaxed">{service.desc}</p>
                                    </div>
                                    <div className="pt-3 flex items-center justify-between border-t border-white/5 mt-auto">
                                        <span className="text-[#D0B078] font-bold text-base">{service.price}</span>
                                        <Link
                                            href={`/${locale}/booking/select`}
                                            className="text-[11px] text-white/55 hover:text-white transition-colors uppercase tracking-widest font-semibold flex items-center gap-1"
                                        >
                                            {dict.common.bookNow} <span className="text-[#D0B078]">→</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Gallery Strip ──────────────────────────────────────────────── */}
            {workImages.length > 0 && (
                <section className="py-10 px-6 overflow-hidden">
                    <div className="max-w-5xl mx-auto">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium text-center mb-6">
                            {locale === 'es' ? 'Galería de trabajos' : 'Our work'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {workImages.map((img) => (
                                <div key={img.imageUrl} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                                    <Image
                                        src={img.imageUrl}
                                        alt={img.caption}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                        <span className="text-white text-xs font-medium">{img.caption}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── Testimonials ───────────────────────────────────────────────── */}
            <section className="py-14 sm:py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10 sm:mb-16 space-y-3">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                            {locale === 'es' ? 'Clientes satisfechos' : 'Happy clients'}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            {dict.home.testimonials.title}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t) => (
                            <div key={t.authorName} className="glass-card rounded-2xl p-7 space-y-5">
                                {/* Stars */}
                                <div className="flex gap-0.5">
                                    {Array.from({ length: t.rating }).map((_, i) => (
                                        <span key={i} className="text-[#D0B078] text-sm">★</span>
                                    ))}
                                </div>
                                <p className="text-white/75 text-sm leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                                <div className="pt-2 border-t border-white/5 space-y-0.5">
                                    <p className="font-semibold text-sm">{t.authorName}</p>
                                    <p className="text-white/50 text-xs">{t.vehicleType} · {t.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Work With Us ───────────────────────────────────────────────── */}
            <section className="py-16 px-6 border-y border-white/5">
                <div className="max-w-5xl mx-auto">
                    <div
                        className="rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
                        style={{
                            background: 'linear-gradient(135deg, rgba(208,176,120,0.07) 0%, rgba(208,176,120,0.02) 100%)',
                            border: '1px solid rgba(208,176,120,0.12)',
                        }}
                    >
                        <div className="text-center sm:text-left space-y-2">
                            <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                                {locale === 'es' ? 'Para profesionales' : 'For professionals'}
                            </p>
                            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                                {locale === 'es' ? '¿Eres detallador? Trabaja con nosotros.' : 'Are you a detailer? Work with us.'}
                            </h2>
                            <p className="text-white/45 text-sm max-w-md">
                                {locale === 'es'
                                    ? 'Accede a más clientes, establece tu horario y haz crecer tu negocio con nosotros.'
                                    : 'Access more clients, set your own schedule, and grow your business with us.'}
                            </p>
                        </div>
                        <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                            <Link
                                href={`/${locale}/register?next=/${locale}/contractors/apply`}
                                className="btn-primary px-7 py-3.5 rounded-xl font-semibold text-sm tracking-wide shadow-[var(--shadow-glow)] whitespace-nowrap text-center"
                            >
                                {locale === 'es' ? 'Crear cuenta y aplicar →' : 'Create account & apply →'}
                            </Link>
                            <Link
                                href={`/${locale}/contractor/login`}
                                className="px-7 py-3.5 rounded-xl font-semibold text-sm tracking-wide border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all whitespace-nowrap text-center"
                            >
                                {locale === 'es' ? 'Ya tengo cuenta' : 'I have an account'}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Final CTA ───────────────────────────────────────────────────── */}
            <section className="py-14 sm:py-24 px-6">
                <div className="max-w-2xl mx-auto text-center space-y-8">
                    <div
                        className="rounded-3xl p-6 sm:p-12 space-y-6 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(208, 176, 120, 0.08) 0%, rgba(208, 176, 120, 0.02) 100%)',
                            border: '1px solid rgba(208, 176, 120, 0.15)',
                        }}
                    >
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background:
                                    'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(208, 176, 120, 0.12) 0%, transparent 70%)',
                            }}
                        />
                        <div className="relative z-10 space-y-4">
                            <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                                {locale === 'es'
                                    ? 'Tu auto merece lo mejor.'
                                    : 'Your car deserves the best.'}
                            </h2>
                            <p className="text-white/50 leading-relaxed">
                                {locale === 'es'
                                    ? 'Reserva en 2 minutos. Sin contratos. Sin sorpresas.'
                                    : 'Book in 2 minutes. No contracts. No surprises.'}
                            </p>
                        </div>
                        <div className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href={`/${locale}/booking/select`}
                                className="btn-primary inline-block px-8 py-4 rounded-xl font-semibold text-sm tracking-wide shadow-[var(--shadow-glow)]"
                            >
                                {dict.common.bookNow}
                            </Link>
                            <Link
                                href={`/${locale}/register`}
                                className="inline-block px-8 py-4 rounded-xl font-semibold text-sm tracking-wide border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                            >
                                {dict.common.getStarted}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Footer ──────────────────────────────────────────────────────── */}
            <footer className="border-t border-white/5 py-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/55 text-xs">
                    <div className="flex flex-col items-center sm:items-start gap-3">
                        <Image src="/dtailwash_logo_final.png" alt={dict.common.siteName} width={365} height={97} className="w-auto h-16 sm:h-20 opacity-70" />
                        <p>© {new Date().getFullYear()}</p>
                        <p>
                            {locale === 'es' ? 'Diseñado por' : 'Designed by'}{' '}
                            <span className="text-white/45 font-medium">OAC Digital Innovations</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2">
                        <Link href={`/${locale}/terms`} className="hover:text-white/60 transition-colors">
                            {locale === 'es' ? 'Términos' : 'Terms'}
                        </Link>
                        <Link href={`/${locale}/privacy`} className="hover:text-white/60 transition-colors">
                            {locale === 'es' ? 'Privacidad' : 'Privacy'}
                        </Link>
                        <Link href={`/${locale}/contractors`} className="hover:text-white/60 transition-colors">
                            {locale === 'es' ? 'Trabaja con nosotros' : 'Work with us'}
                        </Link>
                        <Link href={`/${locale}/contractor/login`} className="hover:text-white/60 transition-colors">
                            {locale === 'es' ? 'Acceso contratistas' : 'Contractor login'}
                        </Link>
                        <Link href={`/${locale}/login`} className="hover:text-white/60 transition-colors">
                            {locale === 'es' ? 'Iniciar sesión' : 'Log in'}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
