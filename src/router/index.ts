import { useUserStore } from '@/store/user'
import { createRouter, createWebHistory } from "vue-router"
import DefaultLayout from "@/layouts/DefaultLayout.vue"

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/User/Login.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/",
    component: DefaultLayout,
    meta: { requiresAuth: false }, // 暂时跳过登录验证
    children: [
      {
        path: "",
        name: "Dashboard",
        component: () => import("@/views/Dashboard/index.vue"),
        meta: { title: "首页概览" },
      },
      {
        path: "/monitor",
        name: "Monitor",
        component: () => import("@/views/Monitor/index.vue"),
        meta: { title: "实时监控" },
      },
      {
        path: "/alarm-center",
        name: "AlarmCenter",
        component: () => import("@/views/AlarmCenter/index.vue"),
        meta: { title: "告警中心" },
      },
      {
        path: "/area-config",
        name: "AreaConfig",
        component: () => import("@/views/AreaConfig/index.vue"),
        meta: { title: "区域配置" },
      },
      {
        path: "/behavior-detect",
        name: "BehaviorDetect",
        component: () => import("@/views/BehaviorDetect/index.vue"),
        meta: { title: "行为检测" },
      },
      {
        path: "/face-auth",
        name: "FaceAuth",
        component: () => import("@/views/FaceAuth/index.vue"),
        meta: { title: "身份认证" },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const publicPages = ['/login', '/register']
  console.log('Navigating to:', to.path, 'isLoggedIn:', userStore.isLoggedIn)
  if (publicPages.includes(to.path)) {
    return next()
  }
  if (!userStore.isLoggedIn) {
    return next('/login')
  }
  if (to.path === '/login') {
    return next('/')
  }
  return next()
})

export default router
