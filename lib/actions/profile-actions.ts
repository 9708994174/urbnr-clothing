"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: {
  full_name?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in" }
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email, // Include email to satisfy not-null constraint
        ...data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/account")
    return { success: true, message: "Profile updated successfully!" }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in" }
  }

  try {
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error && error.code !== "PGRST116") throw error

    return { success: true, profile: profile || { id: user.id, email: user.email } }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getOrders() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in" }
  }

  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        catalog_products:catalog_product_id(id, name, image_url, description),
        products:product_id(id, product_name, image_url, description, product_type)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, orders: orders || [] }
  } catch (error: any) {
    return { error: error.message }
  }
}
