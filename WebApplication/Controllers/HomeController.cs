namespace WebApplication.Controllers
{
    using System.Web.Mvc;

    public class HomeController : Controller
    {
        public ViewResult Index()
        {
            return this.View();
        }
    }
}