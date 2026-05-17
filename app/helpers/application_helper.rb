module ApplicationHelper
  def nav_link_class(request_or_path, path = nil)
    path ||= request_or_path
    base = "text-[0.72rem] font-medium uppercase tracking-[0.18em] transition-colors hover:text-accent"
    active = current_page?(path) ? "text-accent" : "text-dark"

    "#{base} #{active}"
  end

  def mobile_nav_link_class(path)
    base = "border-b border-dark/10 py-4 text-[0.78rem] font-medium uppercase tracking-[0.18em] transition-colors hover:text-accent"
    active = current_page?(path) ? "text-accent" : "text-dark"

    "#{base} #{active}"
  end

  def footer_link_class(_path = nil)
    "text-mid text-sm transition-colors duration-200 hover:text-dark"
  end
end
