"use client";

import { motion } from "framer-motion";
import { Ticket, Calendar, Heart, TrendingUp, Clock, MapPin, DollarSign, ArrowUpRight, ArrowDownRight, Minus, Plus, Search, Filter, ChevronDown, MoreVertical, Star, Settings } from "lucide-react";
import Link from "next/link";

const stats = [
  {
    name: "Upcoming Events",
    value: "3",
    change: "+1 this month",
    changeType: "increase",
    icon: Calendar,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
  },
  {
    name: "Active Tickets",
    value: "5",
    change: "2 expiring soon",
    changeType: "warning",
    icon: Ticket,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-500/10 dark:bg-green-500/20",
  },
  {
    name: "Favorites",
    value: "12",
    change: "+3 this week",
    changeType: "increase",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-500/10 dark:bg-pink-500/20",
  },
  {
    name: "Spent This Year",
    value: "$1,247",
    change: "+12% vs last year",
    changeType: "increase",
    icon: DollarSign,
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: "Taylor Swift - The Eras Tour",
    date: "2024-03-15",
    time: "7:30 PM",
    venue: "SoFi Stadium",
    location: "Los Angeles, CA",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161f5524?w=400&h=250&fit=crop",
    status: "confirmed",
    ticketType: "VIP",
    price: "$299",
  },
  {
    id: 2,
    title: "Lakers vs Warriors",
    date: "2024-03-22",
    time: "8:00 PM",
    venue: "Crypto.com Arena",
    location: "Los Angeles, CA",
    image: "https://images.unsplash.com/photo-1546519638-68e109198e64?w=400&h=250&fit=crop",
    status: "confirmed",
    ticketType: "Premium",
    price: "$189",
  },
  {
    id: 3,
    title: "Hamilton - Broadway Musical",
    date: "2024-04-05",
    time: "7:00 PM",
    venue: "Pantages Theatre",
    location: "Los Angeles, CA",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=250&fit=crop",
    status: "pending",
    ticketType: "Standard",
    price: "$149",
  },
];

const recommendedEvents = [
  {
    id: 4,
    title: "Ed Sheeran - Mathematics Tour",
    date: "2024-05-10",
    venue: "Hollywood Bowl",
    location: "Los Angeles, CA",
    category: "Concert",
    image: "https://images.unsplash.com/photo-1501386764028-2b2d0a6c5b4c?w=400&h=250&fit=crop",
    price: "From $89",
    popularity: 95,
  },
  {
    id: 5,
    title: "Comedy Night with Dave Chappelle",
    date: "2024-04-18",
    venue: "The Comedy Store",
    location: "Los Angeles, CA",
    category: "Comedy",
    image: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&h=250&fit=crop",
    price: "From $65",
    popularity: 88,
  },
  {
    id: 6,
    title: "LA Marathon 2024",
    date: "2024-03-17",
    venue: "Downtown LA",
    location: "Los Angeles, CA",
    category: "Sports",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=250&fit=crop",
    price: "Free Entry",
    popularity: 92,
  },
  {
    id: 7,
    title: "Modern Art Exhibition",
    date: "2024-04-01 - 04-30",
    venue: "LACMA",
    location: "Los Angeles, CA",
    category: "Arts",
    image: "https://images.unsplash.com/photo-1531058020387-3f3b74d7b3a4?w=400&h=250&fit=crop",
    price: "From $25",
    popularity: 76,
  },
];

const recentActivity = [
  { action: "Purchased tickets for", event: "Taylor Swift - The Eras Tour", time: "2 hours ago", type: "purchase" },
  { action: "Added to favorites", event: "Ed Sheeran - Mathematics Tour", time: "1 day ago", type: "favorite" },
  { action: "Received refund for", event: "Cancelled: Jazz Festival 2024", time: "3 days ago", type: "refund" },
  { action: "Left a review for", event: "Lakers vs Celtics", time: "1 week ago", type: "review" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">John</span>!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your events and tickets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <Link
            href="/events"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Browse Events
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {stat.changeType === "increase" && <ArrowUpRight className="w-3 h-3 text-green-500" />}
                  {stat.changeType === "decrease" && <ArrowDownRight className="w-3 h-3 text-red-500" />}
                  {stat.changeType === "warning" && <Clock className="w-3 h-3 text-yellow-500" />}
                  {stat.changeType === "neutral" && <Minus className="w-3 h-3 text-gray-500" />}
                  <span className={`text-xs font-medium ${
                    stat.changeType === "increase" ? "text-green-600 dark:text-green-400" :
                    stat.changeType === "decrease" ? "text-red-600 dark:text-red-400" :
                    stat.changeType === "warning" ? "text-yellow-600 dark:text-yellow-400" :
                    "text-gray-500 dark:text-gray-400"
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`${stat.bgColor} rounded-xl p-3`}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color.split(" ")[0].replace("from-", "").replace("to-", "") }} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Upcoming Events */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
          <Link href="/dashboard/tickets" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            View All
            <ChevronDown className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingEvents.map((event, index) => (
            <motion.article
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all group"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.status === "confirmed" ? "bg-green-500/90 text-white" :
                    event.status === "pending" ? "bg-yellow-500/90 text-white" :
                    "bg-gray-500/90 text-white"
                  } backdrop-blur-sm`}>
                    {event.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{event.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <span>·</span>
                  <Clock className="w-4 h-4" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{event.venue}, {event.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium rounded">{event.ticketType}</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{event.price}</span>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      {/* Recommended Events & Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid lg:grid-cols-3 gap-6"
      >
        {/* Recommended Events */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recommended for You</h2>
            <Link href="/events" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Explore More
              <ChevronDown className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedEvents.map((event, index) => (
              <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all group flex flex-col"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                      {event.category}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                      <TrendingUp className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{event.popularity}%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{event.venue}, {event.location}</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{event.price}</span>
                    <Link
                      href={`/events/${event.id}`}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <input
                type="search"
                placeholder="Search activity..."
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700"
              />
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === "purchase" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                      activity.type === "favorite" ? "bg-pink-500/10 text-pink-600 dark:text-pink-400" :
                      activity.type === "refund" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                      "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    }`}>
                      {activity.type === "purchase" && <Ticket className="w-4 h-4" />}
                      {activity.type === "favorite" && <Heart className="w-4 h-4" />}
                      {activity.type === "refund" && <DollarSign className="w-4 h-4" />}
                      {activity.type === "review" && <Star className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.action}</span>{" "}
                        <span className="font-semibold">{activity.event}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <Link href="/dashboard/activity" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 w-full">
                View All Activity
                <ChevronDown className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </motion.div>

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Browse Events", href: "/events", icon: Calendar, color: "from-blue-500 to-blue-600" },
            { name: "My Tickets", href: "/dashboard/tickets", icon: Ticket, color: "from-green-500 to-green-600" },
            { name: "Favorites", href: "/dashboard/favorites", icon: Heart, color: "from-pink-500 to-rose-500" },
            { name: "Settings", href: "/dashboard/settings", icon: Settings, color: "from-purple-500 to-indigo-500" },
          ].map((action, index) => (
            <motion.button
              key={action.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-transparent transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br" style={{ background: `linear-gradient(to bottom right, ${action.color})`, opacity: 0.05 }} />
              <Link href={action.href} className="relative z-10 flex flex-col items-center text-center h-full">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(to bottom right, ${action.color})` }}>
                  <action.icon className="w-7 h-7 text-white" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{action.name}</span>
              </Link>
            </motion.button>
          ))}
        </div>
      </motion.section>
    </div>
  );
}